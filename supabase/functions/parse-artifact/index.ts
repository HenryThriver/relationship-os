// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { serve, ServerRequest } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log("Hello from Functions!")

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  let artifactIdFromRequest: string | undefined;

  try {
    // Expect artifactId directly in the body
    const { artifactId } = await req.json();
    artifactIdFromRequest = artifactId; // Store for potential use in catch block

    if (!artifactId) {
      console.error('Invalid payload: artifactId is missing', await req.text()); // Log raw body for debugging
      return new Response(JSON.stringify({ error: 'artifactId is required in the request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch the artifact record using the provided artifactId
    const { data: fetchedArtifactRecord, error: fetchError } = await supabase
      .from('artifacts')
      .select('*') // Select all fields, or specify as needed
      .eq('id', artifactId)
      .single();

    if (fetchError || !fetchedArtifactRecord) {
      console.error(`Error fetching artifact ${artifactId}:`, fetchError);
      return new Response(JSON.stringify({ error: `Failed to fetch artifact: ${fetchError?.message || 'Not found'}` }), {
        status: 404, // Not found or other fetch error
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Validate fetched artifact record (replacing previous 'record' which was from direct payload)
    if (!fetchedArtifactRecord.id || !fetchedArtifactRecord.contact_id || !fetchedArtifactRecord.type) {
      console.error('Invalid artifact structure fetched from DB:', fetchedArtifactRecord);
      return new Response(JSON.stringify({ error: 'Invalid artifact structure in database' }), {
        status: 500, // Internal server error, as this shouldn't happen if DB is consistent
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Check if the artifact type is configured for AI processing
    const { data: processingConfig, error: configError } = await supabase
      .from('artifact_processing_config')
      .select('*')
      .eq('artifact_type', fetchedArtifactRecord.type)
      .eq('enabled', true)
      .single();

    if (configError || !processingConfig) {
      console.log(`Skipping parsing for artifact ${fetchedArtifactRecord.id}: Unsupported type: ${fetchedArtifactRecord.type}`);
      return new Response(JSON.stringify({ message: 'Artifact type not supported for AI parsing.' }), { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Check if artifact is ready for processing
    if (fetchedArtifactRecord.ai_parsing_status !== 'pending') {
      console.log(`Skipping parsing for artifact ${fetchedArtifactRecord.id}: AI Parsing Status: ${fetchedArtifactRecord.ai_parsing_status}`);
      return new Response(JSON.stringify({ message: 'Artifact not ready for parsing or already processed/skipped.' }), { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Validate based on processing configuration
    if (processingConfig.requires_transcription && (!fetchedArtifactRecord.transcription || fetchedArtifactRecord.transcription_status !== 'completed')) {
      console.log(`Skipping parsing for ${fetchedArtifactRecord.type} ${fetchedArtifactRecord.id}: Transcription not ready`);
      return new Response(JSON.stringify({ message: `${fetchedArtifactRecord.type} transcription not ready for parsing.` }), { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    if (processingConfig.requires_content && !fetchedArtifactRecord.content) {
      console.log(`Skipping parsing for ${fetchedArtifactRecord.type} ${fetchedArtifactRecord.id}: No content available`);
      return new Response(JSON.stringify({ message: `${fetchedArtifactRecord.type} content not available for parsing.` }), { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Check required metadata fields
    if (processingConfig.requires_metadata_fields && processingConfig.requires_metadata_fields.length > 0) {
      const metadata = fetchedArtifactRecord.metadata || {};
      const missingFields = processingConfig.requires_metadata_fields.filter((field: string) => !metadata.hasOwnProperty(field));
      
      if (missingFields.length > 0) {
        console.log(`Skipping parsing for ${fetchedArtifactRecord.type} ${fetchedArtifactRecord.id}: Missing required metadata fields: ${missingFields.join(', ')}`);
        return new Response(JSON.stringify({ message: `${fetchedArtifactRecord.type} missing required metadata fields: ${missingFields.join(', ')}` }), { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
    }

    // Update parsing status to 'processing'
    // Use fetchedArtifactRecord.id
    const { error: updateToProcessingError } = await supabase
      .from('artifacts')
      .update({ 
        ai_parsing_status: 'processing',
        // Explicitly set ai_processing_started_at here if not already set by caller.
        // This ensures it's set when this function begins actual work.
        ai_processing_started_at: fetchedArtifactRecord.ai_processing_started_at || new Date().toISOString(),
        ai_processing_completed_at: null // Ensure completion time is null when starting
      })
      .eq('id', fetchedArtifactRecord.id);

    if (updateToProcessingError) {
      console.error(`Error updating artifact ${fetchedArtifactRecord.id} to processing:`, updateToProcessingError);
      throw new Error(`Failed to update artifact status to processing: ${updateToProcessingError.message}`);
    }

    // Get contact data
    // Use fetchedArtifactRecord.contact_id
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', fetchedArtifactRecord.contact_id)
      .single();

    if (contactError || !contact) {
      console.error(`Contact not found for ID ${fetchedArtifactRecord.contact_id}:`, contactError);
      await supabase.from('artifacts').update({ ai_parsing_status: 'failed', ai_processing_completed_at: new Date().toISOString() }).eq('id', fetchedArtifactRecord.id);
      throw new Error(contactError ? `Contact fetch error: ${contactError.message}` : 'Contact not found');
    }
    
    console.log(`Processing artifact ${fetchedArtifactRecord.id} for contact ${contact.id}`);

    // Get content to analyze based on artifact type
    let contentToAnalyze: string;
    let isOnboardingMemo = false;
    let isSelfLinkedInProfile = false;
    
    if (fetchedArtifactRecord.type === 'voice_memo') {
      contentToAnalyze = fetchedArtifactRecord.transcription;
      
      // Check if this is a self-contact (user's own profile) and if it's an onboarding voice memo
      isOnboardingMemo = contact.is_self_contact && 
                        (fetchedArtifactRecord.metadata?.is_onboarding === 'true' || 
                         fetchedArtifactRecord.metadata?.source === 'onboarding_voice_recorder');
    } else if (fetchedArtifactRecord.type === 'meeting') {
      contentToAnalyze = fetchedArtifactRecord.content;
    } else if (fetchedArtifactRecord.type === 'email') {
      // For emails, include both subject and content AND directionality context
      const emailSubject = fetchedArtifactRecord.metadata?.subject || '';
      const emailContent = fetchedArtifactRecord.content || '';
      const fromEmail = fetchedArtifactRecord.metadata?.from?.email || '';
      const toEmails = fetchedArtifactRecord.metadata?.to?.map((t: any) => t.email).join(', ') || '';
      
      // Determine email direction relative to the contact
      const isFromContact = fromEmail.toLowerCase().includes(contact.email?.toLowerCase() || contact.name?.toLowerCase());
      const isToContact = toEmails.toLowerCase().includes(contact.email?.toLowerCase() || contact.name?.toLowerCase());
      
      let directionContext = '';
      if (isFromContact) {
        directionContext = `\nEMAIL DIRECTION: This email was SENT BY the contact (${contact.name}). Information in first person ("I", "my", "we") refers to the contact.`;
      } else if (isToContact) {
        directionContext = `\nEMAIL DIRECTION: This email was SENT TO the contact (${contact.name}) by someone else. Information in first person ("I", "my", "we") refers to the EMAIL SENDER, NOT the contact. Only extract information that is explicitly ABOUT the contact or information the contact would learn from this email.`;
      } else {
        directionContext = `\nEMAIL DIRECTION: Unclear email direction. Be very careful about attribution - only extract information that is explicitly about the contact.`;
      }
      
      contentToAnalyze = `Subject: ${emailSubject}\n\nFrom: ${fromEmail}\nTo: ${toEmails}${directionContext}\n\nContent:\n${emailContent}`;
    } else if (fetchedArtifactRecord.type === 'linkedin_post') {
      // For LinkedIn posts, analyze the post content and engagement
      const postMetadata = fetchedArtifactRecord.metadata;
      const isAuthor = postMetadata.is_author;
      const author = postMetadata.author;
      const postContent = postMetadata.content;
      const postType = postMetadata.post_type;
      const engagement = postMetadata.engagement || {};
      const hashtags = postMetadata.hashtags || [];
      const mentions = postMetadata.mentions || [];
      const postedAt = postMetadata.posted_at;
      
      let authorshipContext = '';
      if (isAuthor) {
        authorshipContext = `\nPOST AUTHORSHIP: This post was AUTHORED BY the contact (${contact.name}). This reveals the contact's professional opinions, activities, achievements, and interests.`;
      } else {
        authorshipContext = `\nPOST AUTHORSHIP: This post was authored by ${author}, not the contact. Only extract information that is explicitly ABOUT the contact or where the contact is mentioned/tagged.`;
      }
      
      contentToAnalyze = `LinkedIn ${postType} by ${author}
Posted on: ${postedAt}${authorshipContext}

Post Content:
${postContent}

Hashtags: ${hashtags.join(', ')}
Mentions: ${mentions.join(', ')}

Engagement Metrics:
- Likes: ${engagement.likes || 0}
- Comments: ${engagement.comments || 0}  
- Shares: ${engagement.shares || 0}

ANALYSIS FOCUS: Extract professional updates, achievements, interests, company changes, project involvement, or relationship intelligence that can help maintain and strengthen the relationship with this contact.`;
    } else if (fetchedArtifactRecord.type === 'linkedin_profile') {
      // Check if this is the user's own LinkedIn profile
      isSelfLinkedInProfile = contact.is_self_contact;
      
      // For LinkedIn profiles, analyze the professional information
      const profileMetadata = fetchedArtifactRecord.metadata;
      const about = profileMetadata.about || '';
      const headline = profileMetadata.headline || '';
      const experience = profileMetadata.experience || [];
      const education = profileMetadata.education || [];
      const skills = profileMetadata.skills || [];
      const certifications = profileMetadata.certifications || [];
      
      if (isSelfLinkedInProfile) {
        // For user's own profile, focus on self-analysis
        contentToAnalyze = `User's LinkedIn Profile - Self Analysis

Name: ${contact.name}
Headline: ${headline}

About Section:
${about}

Experience:
${experience.map((exp: any) => `- ${exp.title} at ${exp.company} (${exp.duration || 'Present'})`).join('\n')}

Education:
${education.map((edu: any) => `- ${edu.degree} from ${edu.school} (${edu.year || 'N/A'})`).join('\n')}

Skills: ${skills.map((skill: any) => skill.name || skill).join(', ')}

Certifications: ${certifications.map((cert: any) => cert.name).join(', ')}

SELF-ANALYSIS FOCUS: Extract insights about the user's professional strengths, expertise areas, communication style, ways they can help others, introduction opportunities, and knowledge they can share. This is for building the user's own profile to improve their networking and relationship management.`;
      } else {
        // For other contacts' profiles
        contentToAnalyze = `LinkedIn Profile for ${contact.name}

Headline: ${headline}

About Section:
${about}

Experience:
${experience.map((exp: any) => `- ${exp.title} at ${exp.company} (${exp.duration || 'Present'})`).join('\n')}

Education:
${education.map((edu: any) => `- ${edu.degree} from ${edu.school} (${edu.year || 'N/A'})`).join('\n')}

Skills: ${skills.map((skill: any) => skill.name || skill).join(', ')}

Certifications: ${certifications.map((cert: any) => cert.name).join(', ')}

ANALYSIS FOCUS: Extract professional updates, career changes, skills, achievements, company information, educational background, and relationship intelligence that can help maintain and strengthen the relationship with this contact.`;
      }
    } else {
      contentToAnalyze = fetchedArtifactRecord.content || '';
    }
    
    // Call appropriate OpenAI parsing function based on artifact type and context
    let aiParseResult;
    if (isOnboardingMemo) {
      aiParseResult = await parseOnboardingVoiceMemo(contentToAnalyze, contact, fetchedArtifactRecord.metadata);
    } else if (isSelfLinkedInProfile) {
      aiParseResult = await parseSelfLinkedInProfile(contentToAnalyze, contact, fetchedArtifactRecord.metadata);
    } else {
      aiParseResult = await parseWithOpenAI(contentToAnalyze, contact, fetchedArtifactRecord);
    }

    if (aiParseResult === null) {
      console.error(`AI parsing failed for artifact ${fetchedArtifactRecord.id}. parseWithOpenAI returned null.`);
      await supabase.from('artifacts').update({ 
          ai_parsing_status: 'failed', 
          ai_processing_completed_at: new Date().toISOString() 
      }).eq('id', fetchedArtifactRecord.id);
      throw new Error('AI parsing failed, parseWithOpenAI returned null.'); 
    }

    const contactUpdateSuggestions = aiParseResult.contact_updates || [];
    const loopSuggestions = aiParseResult.suggested_loops || [];
    const userId = contact.user_id; // Assuming contact object has user_id

    let suggestionsStoredCount = 0;
    let loopsSuggestedCount = 0;
    let directUpdatesApplied = 0;

    // For onboarding voice memos and self-LinkedIn profiles, apply updates directly to the user's self-contact
    if ((isOnboardingMemo || isSelfLinkedInProfile) && contactUpdateSuggestions.length > 0) {
      console.log(`Applying ${contactUpdateSuggestions.length} direct updates to self-contact for onboarding memo`);
      
      // Build the update object from the AI suggestions
      const contactUpdates: any = {};
      
      for (const suggestion of contactUpdateSuggestions) {
        if (suggestion.confidence >= 0.6) { // Only apply high-confidence updates
          const { field_path, action, suggested_value } = suggestion;
          
          // Handle nested field paths (e.g., "professional_context.career_goals")
          const pathParts = field_path.split('.');
          
          if (pathParts.length === 1) {
            // Simple field (e.g., "primary_goal", "networking_challenges")
            if (action === 'add' && Array.isArray(suggested_value)) {
              // For array fields, merge with existing values and any previous updates
              const currentValue = contactUpdates[field_path] || contact[field_path] || [];
              contactUpdates[field_path] = [...currentValue, ...suggested_value];
            } else if (action === 'add' && Array.isArray(contact[field_path])) {
              // For adding single values to arrays
              const currentValue = contactUpdates[field_path] || contact[field_path] || [];
              contactUpdates[field_path] = [...currentValue, suggested_value];
            } else {
              // For simple updates/replacements
              contactUpdates[field_path] = suggested_value;
            }
          } else if (pathParts.length === 2) {
            // Nested field (e.g., "professional_context.career_goals")
            const [parentField, childField] = pathParts;
            
            if (!contactUpdates[parentField]) {
              contactUpdates[parentField] = contact[parentField] || {};
            }
            
            if (action === 'add' && Array.isArray(suggested_value)) {
              const currentValue = contactUpdates[parentField]?.[childField] || contact[parentField]?.[childField] || [];
              contactUpdates[parentField][childField] = [...currentValue, ...suggested_value];
            } else if (action === 'add' && Array.isArray(contactUpdates[parentField]?.[childField] || contact[parentField]?.[childField])) {
              const currentValue = contactUpdates[parentField]?.[childField] || contact[parentField]?.[childField] || [];
              contactUpdates[parentField][childField] = [...currentValue, suggested_value];
            } else {
              contactUpdates[parentField][childField] = suggested_value;
            }
          }
          
          directUpdatesApplied++;
          console.log(`Applied update: ${field_path} = ${JSON.stringify(suggested_value)}`);
        }
      }
      
      // Apply the updates to the contact record
      if (Object.keys(contactUpdates).length > 0) {
        const { error: updateContactError } = await supabase
          .from('contacts')
          .update(contactUpdates)
          .eq('id', contact.id)
          .eq('user_id', userId);
          
        if (updateContactError) {
          console.error(`Error applying direct updates to self-contact:`, updateContactError);
        } else {
          console.log(`Successfully applied ${directUpdatesApplied} updates to self-contact`);
        }
      }
    } else if (contactUpdateSuggestions.length > 0) {
      // For non-onboarding memos, store as suggestions for manual review
      const { error: insertSuggestionsError } = await supabase
        .from('contact_update_suggestions')
        .insert({
          artifact_id: fetchedArtifactRecord.id,
          contact_id: fetchedArtifactRecord.contact_id,
          user_id: userId,
          suggested_updates: { suggestions: contactUpdateSuggestions }, // Ensure this matches expected structure
          field_paths: contactUpdateSuggestions.map(s => s.field_path),
          confidence_scores: Object.fromEntries(contactUpdateSuggestions.map(s => [s.field_path, s.confidence]))
        });

      if (insertSuggestionsError) {
        console.error(`Error inserting contact update suggestions for artifact ${fetchedArtifactRecord.id}:`, insertSuggestionsError);
        // Potentially throw or handle differently, for now, we continue to process loop suggestions
      } else {
        suggestionsStoredCount = contactUpdateSuggestions.length;
        console.log(`${suggestionsStoredCount} contact update suggestions stored for artifact ${fetchedArtifactRecord.id}.`);
      }
    }

    // Store loop suggestions (if any)
    if (loopSuggestions.length > 0) {
      const validLoopSuggestions = loopSuggestions
        .filter(suggestion => suggestion.confidence >= 0.7) // As per roadmap
        .map(suggestion => ({
          user_id: userId,
          contact_id: fetchedArtifactRecord.contact_id,
          source_artifact_id: fetchedArtifactRecord.id,
          suggestion_data: suggestion, // Store the whole suggestion object (type, title, description, etc.)
          status: 'pending', // Default status
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

      if (validLoopSuggestions.length > 0) {
        const { error: loopSuggestionsError } = await supabase
          .from('loop_suggestions')
          .insert(validLoopSuggestions);

        if (loopSuggestionsError) {
          console.error('Error storing loop suggestions:', loopSuggestionsError);
          // Potentially throw or handle differently
        } else {
          loopsSuggestedCount = validLoopSuggestions.length;
          console.log(`${loopsSuggestedCount} loop suggestions stored for artifact ${fetchedArtifactRecord.id}.`);
        }
      }
    }
    
    // For meetings, also extract and store insights in the artifact metadata
    if (fetchedArtifactRecord.type === 'meeting' && aiParseResult.contact_updates.length > 0) {
      try {
        // Extract action items and insights from the AI response
        const actionItems = aiParseResult.contact_updates
          .filter(update => update.field_path === 'next_steps' && update.action === 'add')
          .map((update, index) => ({
            id: `ai-${Date.now()}-${index}`,
            description: update.suggested_value,
            priority: 'medium' as const,
            completed: false,
          }));

        const keyTopics = aiParseResult.contact_updates
          .filter(update => update.field_path === 'key_pain_points_discussed' || update.field_path === 'opportunities_identified')
          .map(update => update.suggested_value)
          .flat();

        const summary = aiParseResult.contact_updates
          .find(update => update.field_path === 'summary_of_conversation')?.suggested_value;

        // Update meeting metadata with insights
        if (actionItems.length > 0 || keyTopics.length > 0 || summary) {
          const currentMetadata = fetchedArtifactRecord.metadata || {};
          const updatedMetadata = {
            ...currentMetadata,
            insights: {
              ...currentMetadata.insights,
              actionItems: actionItems.length > 0 ? actionItems : currentMetadata.insights?.actionItems,
              keyTopics: keyTopics.length > 0 ? keyTopics : currentMetadata.insights?.keyTopics,
              summary: summary || currentMetadata.insights?.summary,
            }
          };

          await supabase
            .from('artifacts')
            .update({ metadata: updatedMetadata })
            .eq('id', fetchedArtifactRecord.id);

          console.log(`Updated meeting metadata with ${actionItems.length} action items and ${keyTopics.length} key topics`);
        }
      } catch (error) {
        console.error('Error updating meeting metadata:', error);
        // Don't fail the whole process if metadata update fails
      }
    }
    
    // Update artifact status to 'completed' only if no major errors occurred during suggestion storage
    // Consider more nuanced error handling if partial success is possible/desired
    const { error: updateToCompletedError } = await supabase
      .from('artifacts')
      .update({ 
        ai_parsing_status: 'completed',
        ai_processing_completed_at: new Date().toISOString()
      })
      .eq('id', fetchedArtifactRecord.id);

    if (updateToCompletedError) {
      console.error(`Error updating artifact ${fetchedArtifactRecord.id} to completed status:`, updateToCompletedError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Processing complete. ${suggestionsStoredCount} contact updates, ${loopsSuggestedCount} loop suggestions.`,
      contact_suggestions_count: suggestionsStoredCount,
      loop_suggestions_count: loopsSuggestedCount
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('General parsing error in Edge Function:', error);
    // Attempt to update artifact status to 'failed' if artifactIdFromRequest is available
    if (artifactIdFromRequest) {
      try {
        const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
        await supabaseAdmin.from('artifacts').update({ 
          ai_parsing_status: 'failed',
          ai_processing_completed_at: new Date().toISOString() 
        }).eq('id', artifactIdFromRequest);
        console.log(`Artifact ${artifactIdFromRequest} marked as failed due to error: ${error.message}`);
      } catch (updateError) {
        console.error(`Failed to update artifact ${artifactIdFromRequest} to failed status after error:`, updateError);
      }
    }
    return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred' }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})

// Define expected AI Response structure
interface AiSuggestion {
  field_path: string;
  action: 'add' | 'update' | 'remove';
  suggested_value: any;
  confidence: number;
  reasoning: string;
}

interface SuggestedLoop {
  type: string; // Corresponds to LoopType values e.g., "introduction", "referral"
  title: string;
  description: string;
  current_status: string; // Corresponds to LoopStatus values e.g., "idea", "queued"
  reciprocity_direction: 'giving' | 'receiving';
  confidence: number;
  reasoning: string;
}

interface AiParseResult {
  contact_updates: AiSuggestion[];
  suggested_loops: SuggestedLoop[];
}

async function parseWithOpenAI(transcription: string, contact: any, fetchedArtifactRecord: any): Promise<AiParseResult | null> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    console.error('OPENAI_API_KEY is not set in environment variables.');
    throw new Error('OpenAI API key is missing.');
  }

  const LOOP_DETECTION_PROMPT_SNIPPET = `
In addition to contact updates, analyze this content for potential relationship loops (ongoing multi-step interactions).

Look for mentions of:
- Offers to help, introduce, refer, share resources
- Requests for help, introductions, referrals, advice
- Follow-ups needed on previous offers/requests
- Commitments made that need tracking

For each potential loop identified, provide:
- type: introduction|referral|resource_share|advice_offer|advice_request|collaboration_proposal (match LoopType values)
- title: Brief descriptive title
- description: What specifically needs to happen
- current_status: idea|queued|offered|received|accepted|in_progress|delivered|following_up (match LoopStatus values)
- reciprocity_direction: giving|receiving
- confidence: 0.0-1.0
- reasoning: Detailed explanation for the suggestion.
`;

  // Determine content type and create appropriate prompt
  const isVoiceMemo = fetchedArtifactRecord.type === 'voice_memo';
  const isMeeting = fetchedArtifactRecord.type === 'meeting';
  const isEmail = fetchedArtifactRecord.type === 'email';
  
  let contentTypeDescription: string;
  let extractionContext: string;
  
  if (isVoiceMemo) {
    contentTypeDescription = 'Voice Memo Transcription';
    extractionContext = 'Extract ALL meaningful updates from this voice memo for the contact\'s profile. Be thorough.';
  } else if (isMeeting) {
    contentTypeDescription = 'Meeting Summary/Content';
    extractionContext = 'Extract ALL meaningful updates from this meeting content for the contact\'s profile. Focus on information shared during the meeting, decisions made, and insights gained about the contact.';
  } else if (isEmail) {
    contentTypeDescription = 'Email Communication';
    extractionContext = 'Extract ALL meaningful updates from this email communication for the contact\'s profile. CRITICAL: Pay close attention to the EMAIL DIRECTION context provided. If the email was sent TO the contact, information in first person ("I", "my", "we") refers to the EMAIL SENDER, not the contact. Only extract information that is explicitly ABOUT the contact or information the contact would learn from receiving this email. If the email was sent BY the contact, then first person statements refer to the contact themselves.';
  } else {
    contentTypeDescription = 'Content';
    extractionContext = 'Extract ALL meaningful updates from this content for the contact\'s profile.';
  }

  // Keep the existing contact update prompt part largely the same
  // but ensure the overall response format is the new one.
  const promptContent = `
RELATIONSHIP INTELLIGENCE EXTRACTION V2 (With Loop Detection)

Contact Name: ${contact.name || 'Unknown'}
Contact Company: ${contact.company || 'Unknown'}
Contact Title: ${contact.title || 'Unknown'}

Current Professional Context (JSON): 
${JSON.stringify(contact.professional_context || {}, null, 2)}

Current Personal Context (JSON): 
${JSON.stringify(contact.personal_context || {}, null, 2)}

${contentTypeDescription}: 
"${transcription}"

EXTRACTION INSTRUCTIONS:
You are an expert relationship intelligence analyst. 
1. ${extractionContext}
2. ${LOOP_DETECTION_PROMPT_SNIPPET}

VALID FIELD PATHS FOR CONTACT UPDATES:

DIRECT CONTACT FIELDS:
- "name" (string)
- "email" (string)
- "phone" (string)
- "title" (string)
- "company" (string)
- "location" (string)
- "linkedin_url" (string)
- "notes" (string)

PERSONAL CONTEXT:
- "personal_context.family.partner.name" (string)
- "personal_context.family.partner.relationship" (string)
- "personal_context.family.partner.details" (string)
- "personal_context.family.children" (array of strings - use action "add" for individual items)
- "personal_context.family.parents" (string)
- "personal_context.family.siblings" (string)
- "personal_context.interests" (array of strings - use action "add" for individual items)
- "personal_context.values" (array of strings - use action "add" for individual items)
- "personal_context.milestones" (array of strings - use action "add" for individual items)
- "personal_context.anecdotes" (array of strings - use action "add" for individual items)
- "personal_context.communication_style" (string)
- "personal_context.relationship_goal" (string)
- "personal_context.conversation_starters.personal" (array of strings - use action "add" for individual items)
- "personal_context.conversation_starters.professional" (array of strings - use action "add" for individual items)
- "personal_context.key_life_events" (array of strings - use action "add" for individual items)
- "personal_context.current_challenges" (array of strings - use action "add" for individual items)
- "personal_context.upcoming_changes" (array of strings - use action "add" for individual items)
- "personal_context.living_situation" (string)
- "personal_context.hobbies" (array of strings - use action "add" for individual items)
- "personal_context.travel_plans" (array of strings - use action "add" for individual items)
- "personal_context.motivations" (array of strings - use action "add" for individual items)
- "personal_context.education" (array of strings - use action "add" for individual items)

PROFESSIONAL CONTEXT:
- "professional_context.current_role" (string)
- "professional_context.current_company" (string)
- "professional_context.goals" (array of strings - use action "add" for individual items)
- "professional_context.background.focus_areas" (string)
- "professional_context.background.previous_companies" (array of strings - use action "add" for individual items)
- "professional_context.background.expertise_areas" (array of strings - use action "add" for individual items)
- "professional_context.current_ventures" (string)
- "professional_context.speaking_topics" (array of strings - use action "add" for individual items)
- "professional_context.achievements" (array of strings - use action "add" for individual items)
- "professional_context.current_role_description" (string)
- "professional_context.key_responsibilities" (array of strings - use action "add" for individual items)
- "professional_context.team_details" (string)
- "professional_context.work_challenges" (array of strings - use action "add" for individual items)
- "professional_context.networking_objectives" (array of strings - use action "add" for individual items)
- "professional_context.skill_development" (array of strings - use action "add" for individual items)
- "professional_context.career_transitions" (array of strings - use action "add" for individual items)
- "professional_context.projects_involved" (array of strings - use action "add" for individual items)
- "professional_context.collaborations" (array of strings - use action "add" for individual items)
- "professional_context.upcoming_projects" (array of strings - use action "add" for individual items)
- "professional_context.skills" (array of strings - use action "add" for individual items)
- "professional_context.industry_knowledge" (array of strings - use action "add" for individual items)
- "professional_context.mentions.colleagues" (array of strings - use action "add" for individual items)
- "professional_context.mentions.clients" (array of strings - use action "add" for individual items)
- "professional_context.mentions.competitors" (array of strings - use action "add" for individual items)
- "professional_context.mentions.collaborators" (array of strings - use action "add" for individual items)
- "professional_context.mentions.mentors" (array of strings - use action "add" for individual items)
- "professional_context.mentions.industry_contacts" (array of strings - use action "add" for individual items)
- "professional_context.opportunities_to_help" (array of strings - use action "add" for individual items)
- "professional_context.introduction_needs" (array of strings - use action "add" for individual items)
- "professional_context.resource_needs" (array of strings - use action "add" for individual items)
- "professional_context.pending_requests" (array of strings - use action "add" for individual items)
- "professional_context.collaboration_opportunities" (array of strings - use action "add" for individual items)

IMPORTANT RULES:
- Only use field paths from this exact list
- For array fields, use action "add" with individual string items, not entire arrays
- For object fields like "personal_context.family.partner", use action "update" with the complete object
- Never create new field paths not listed above

RESPONSE FORMAT (JSON Object):
Provide your response as a single JSON object with two top-level keys: "contact_updates" and "suggested_loops".
- "contact_updates": An array of objects. Each object MUST have "field_path", "action" ("add", "update", or "remove"), "suggested_value", "confidence" (0.0-1.0), and "reasoning".
- "suggested_loops": An array of objects as described in the loop detection section. If no loops, return an empty array.

Example Response:
{
  "contact_updates": [
    {
      "field_path": "title",
      "action": "update",
      "suggested_value": "Senior Director of Marketing",
      "confidence": 0.9,
      "reasoning": "Contact mentioned their new title is 'Senior Director of Marketing'."
    },
    {
      "field_path": "personal_context.hobbies",
      "action": "add",
      "suggested_value": "Marathon running",
      "confidence": 0.75,
      "reasoning": "Contact spoke about training for an upcoming marathon."
    }
  ],
  "suggested_loops": [
    {
      "type": "introduction",
      "title": "Introduce Sarah to Mike for marketing collaboration",
      "description": "Sarah mentioned needing help with B2B marketing, Mike has expertise in this area.",
      "current_status": "idea",
      "reciprocity_direction": "giving",
      "confidence": 0.85,
      "reasoning": "Clear match between Sarah's need and Mike's expertise mentioned in conversation."
    }
  ]
}

If no updates or loops are found, return empty arrays for the respective keys.
Focus on accuracy and completeness. Only suggest updates or loops if reasonably confident.
Be careful with data types. For "add" actions to arrays, "suggested_value" should be the item to add, not the whole array.
For "update" on an object like "personal_context.family.partner", suggested_value is the entire new object.
Do not Hallucinate. If information is not present, do not create it.
Do not include fields in "contact_updates" or "suggested_loops" if confidence is below 0.5.
`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview', // Or your preferred model
        messages: [{ role: 'user', content: promptContent }],
        response_format: { type: "json_object" }, // Ensure JSON mode
        temperature: 0.2, // Lower temperature for more deterministic output
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error(`OpenAI API error: ${res.status} ${res.statusText}`, errorBody);
      throw new Error(`OpenAI API request failed: ${res.status} ${res.statusText}. Body: ${errorBody}`);
    }

    const data = await res.json();
    
    if (!data.choices || data.choices.length === 0 || !data.choices[0].message || !data.choices[0].message.content) {
      console.error('Invalid response structure from OpenAI:', data);
      return null; // Or throw new Error('Invalid response structure from OpenAI');
    }
    
    const suggestionsJson = data.choices[0].message.content;
    // console.log("OpenAI Raw Response:", suggestionsJson); // For debugging

    try {
      const parsedResult = JSON.parse(suggestionsJson) as AiParseResult;
      // Validate structure further if needed
      if (typeof parsedResult.contact_updates === 'undefined' || typeof parsedResult.suggested_loops === 'undefined') {
          console.error('OpenAI response missing contact_updates or suggested_loops key:', parsedResult);
          // Attempt to salvage if one part is present
          return {
            contact_updates: parsedResult.contact_updates || [],
            suggested_loops: parsedResult.suggested_loops || [],
          };
      }
      return parsedResult;
    } catch (e) {
      console.error('Error parsing OpenAI JSON response:', e, suggestionsJson);
      return null; // Or throw e to indicate parsing failure
    }

  } catch (error) {
    console.error('Error in parseWithOpenAI:', error);
    // Do not throw here, let the caller handle the null response and update artifact status
    return null; 
  }
}

async function parseSelfLinkedInProfile(profileContent: string, contact: any, metadata: any): Promise<AiParseResult | null> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    console.error('OPENAI_API_KEY is not set in environment variables.');
    throw new Error('OpenAI API key is missing.');
  }

  const promptContent = `
USER PROFILE EXTRACTION - LINKEDIN SELF-ANALYSIS

User Name: ${contact.name || 'User'}
Current User Profile (JSON): 
${JSON.stringify({
  professional_context: contact.professional_context || {},
  personal_context: contact.personal_context || {},
  ways_to_help_others: contact.ways_to_help_others || [],
  introduction_opportunities: contact.introduction_opportunities || [],
  knowledge_to_share: contact.knowledge_to_share || [],
  primary_goal: contact.primary_goal || null,
  goal_description: contact.goal_description || null
}, null, 2)}

LinkedIn Profile Data: 
${profileContent}

EXTRACTION INSTRUCTIONS:
You are analyzing the USER'S OWN LinkedIn profile to extract insights about their professional strengths, expertise, and how they can provide value to others in their network. This is for building a comprehensive user profile that will drive personalized networking recommendations.

VALID FIELD PATHS FOR USER PROFILE UPDATES:
PROFESSIONAL STRENGTHS & EXPERTISE:
- "professional_context.expertise_areas" (array of strings - their areas of expertise, action: 'add')
- "professional_context.professional_interests" (array of strings - their professional interests, action: 'add')
- "professional_context.industry_insights" (array of strings - insights they can share, action: 'add')
- "professional_context.communication_style" (string - their communication style based on profile tone)
- "professional_context.current_role.responsibilities" (array of strings, action: 'add')
- "professional_context.career_goals" (array of strings - inferred career aspirations, action: 'add')

WAYS TO HELP OTHERS:
- "ways_to_help_others" (array of strings - specific ways they can help others, action: 'add')
- "introduction_opportunities" (array of strings - types of introductions they can facilitate, action: 'add')
- "knowledge_to_share" (array of strings - specific knowledge/expertise they can share, action: 'add')

PERSONAL CONTEXT:
- "personal_context.interests" (array of strings - professional/personal interests, action: 'add')
- "personal_context.values" (array of strings - values evident from their profile, action: 'add')
- "personal_context.motivations" (array of strings - what drives them professionally, action: 'add')

BASIC INFO UPDATES:
- "company" (string - current company)
- "title" (string - current job title)
- "location.city" (string)
- "location.state" (string)
- "location.country" (string)

RESPONSE FORMAT (JSON Object):
{
  "contact_updates": [
    {
      "field_path": "ways_to_help_others",
      "action": "add",
      "suggested_value": "Mentoring early-career professionals in tech",
      "confidence": 0.9,
      "reasoning": "Profile shows senior role and mentions mentoring in experience section."
    }
  ],
  "suggested_loops": []
}

Focus on extracting actionable insights about how the user can provide value to others in their network.
Only include updates with confidence >= 0.7.
Return empty suggested_loops array as this is self-analysis, not relationship loops with others.
Extract specific, actionable ways they can help based on their experience, skills, and achievements.
`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: promptContent }],
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error(`OpenAI API error for self LinkedIn analysis: ${res.status} ${res.statusText}`, errorBody);
      throw new Error(`OpenAI API request failed: ${res.status} ${res.statusText}. Body: ${errorBody}`);
    }

    const data = await res.json();
    
    if (!data.choices || data.choices.length === 0 || !data.choices[0].message || !data.choices[0].message.content) {
      console.error('Invalid response structure from OpenAI for self LinkedIn analysis:', data);
      return null;
    }
    
    const suggestionsJson = data.choices[0].message.content;
    console.log("Self LinkedIn analysis AI response:", suggestionsJson);

    try {
      const parsedResult = JSON.parse(suggestionsJson) as AiParseResult;
      return {
        contact_updates: parsedResult.contact_updates || [],
        suggested_loops: parsedResult.suggested_loops || [], // Should be empty for self-analysis
      };
    } catch (e) {
      console.error('Error parsing OpenAI JSON response for self LinkedIn analysis:', e, suggestionsJson);
      return null;
    }

  } catch (error) {
    console.error('Error in parseSelfLinkedInProfile:', error);
    return null; 
  }
}

async function parseOnboardingVoiceMemo(transcription: string, contact: any, metadata: any): Promise<AiParseResult | null> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    console.error('OPENAI_API_KEY is not set in environment variables.');
    throw new Error('OpenAI API key is missing.');
  }

  // Determine the type of onboarding memo to customize the prompt
  const memoType = metadata?.memo_type || 'general';
  
  let promptContent: string;
  
  if (memoType === 'challenge' || memoType === 'challenges') {
    promptContent = `
USER PROFILE EXTRACTION - NETWORKING CHALLENGES ANALYSIS

User Name: ${contact.name || 'User'}
Current User Profile (JSON): 
${JSON.stringify({
  professional_context: contact.professional_context || {},
  personal_context: contact.personal_context || {},
  networking_challenges: contact.networking_challenges || [],
  ways_to_help_others: contact.ways_to_help_others || [],
  primary_goal: contact.primary_goal || null,
  goal_description: contact.goal_description || null
}, null, 2)}

Voice Memo Transcription (User describing their networking challenges): 
"${transcription}"

EXTRACTION INSTRUCTIONS:
You are analyzing a voice memo where the USER is describing their own networking challenges, goals, and areas where they want to improve their relationship-building skills. Extract insights about the USER THEMSELVES (not about other people).

VALID FIELD PATHS FOR USER PROFILE UPDATES:
USER GOALS & CHALLENGES:
- "networking_challenges" (array of strings - specific networking/relationship challenges they face, action: 'add')
- "primary_goal" (string - their main professional or networking goal)
- "goal_description" (string - detailed description of what they want to achieve)
- "goal_timeline" (string - when they want to achieve this goal)
- "goal_success_criteria" (string - how they'll measure success)

WAYS TO HELP OTHERS:
- "ways_to_help_others" (array of strings - areas where the user can provide value to others, action: 'add')
- "introduction_opportunities" (array of strings - types of introductions they can facilitate, action: 'add')
- "knowledge_to_share" (array of strings - expertise they can share with others, action: 'add')

PROFESSIONAL CONTEXT (about the user):
- "company" (string - their company)
- "title" (string - their job title)
- "professional_context.current_role.responsibilities" (array of strings, action: 'add')
- "professional_context.career_goals" (array of strings, action: 'add')
- "professional_context.professional_development" (array of strings - areas they want to develop, action: 'add')
- "professional_context.industry_insights" (array of strings - their knowledge/insights, action: 'add')

PERSONAL CONTEXT (about the user):
- "personal_context.interests" (array of strings, action: 'add')
- "personal_context.hobbies" (array of strings, action: 'add')
- "personal_context.values" (array of strings, action: 'add')
- "personal_context.motivations" (array of strings, action: 'add')
- "personal_context.communication_style" (string)

GENERAL FIELDS:
- "location.city" (string)
- "location.state" (string)
- "location.country" (string)

RESPONSE FORMAT (JSON Object):
{
  "contact_updates": [
    {
      "field_path": "networking_challenges",
      "action": "add",
      "suggested_value": "Difficulty following up after networking events",
      "confidence": 0.9,
      "reasoning": "User explicitly mentioned struggling with follow-up after meeting new people."
    }
  ],
  "suggested_loops": []
}

Focus on extracting the user's own challenges, goals, strengths, and areas for improvement. Do not extract information about other people mentioned in the transcript.
Only include updates with confidence >= 0.6.
Return empty suggested_loops array as this is about self-reflection, not relationship loops with others.
`;
  } else {
    // General onboarding memo prompt (for other types like goals, profile setup, etc.)
    promptContent = `
USER PROFILE EXTRACTION - ONBOARDING ANALYSIS

User Name: ${contact.name || 'User'}
Current User Profile (JSON): 
${JSON.stringify({
  professional_context: contact.professional_context || {},
  personal_context: contact.personal_context || {},
  primary_goal: contact.primary_goal || null,
  goal_description: contact.goal_description || null
}, null, 2)}

Voice Memo Transcription (User describing themselves): 
"${transcription}"

EXTRACTION INSTRUCTIONS:
Extract information about the USER THEMSELVES from this onboarding voice memo. Focus on their professional background, personal interests, goals, and how they want to use this relationship management system.

VALID FIELD PATHS FOR USER PROFILE UPDATES:
[Use the same field paths as the challenges prompt above]

Focus on building a comprehensive profile of the user themselves.
Only include updates with confidence >= 0.6.
Return empty suggested_loops array for onboarding memos.
`;
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: promptContent }],
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error(`OpenAI API error for onboarding memo: ${res.status} ${res.statusText}`, errorBody);
      throw new Error(`OpenAI API request failed: ${res.status} ${res.statusText}. Body: ${errorBody}`);
    }

    const data = await res.json();
    
    if (!data.choices || data.choices.length === 0 || !data.choices[0].message || !data.choices[0].message.content) {
      console.error('Invalid response structure from OpenAI for onboarding memo:', data);
      return null;
    }
    
    const suggestionsJson = data.choices[0].message.content;
    console.log("Onboarding memo AI response:", suggestionsJson);

    try {
      const parsedResult = JSON.parse(suggestionsJson) as AiParseResult;
      return {
        contact_updates: parsedResult.contact_updates || [],
        suggested_loops: parsedResult.suggested_loops || [], // Should be empty for onboarding
      };
    } catch (e) {
      console.error('Error parsing OpenAI JSON response for onboarding memo:', e, suggestionsJson);
      return null;
    }

  } catch (error) {
    console.error('Error in parseOnboardingVoiceMemo:', error);
    return null; 
  }
}

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/parse-artifact' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
