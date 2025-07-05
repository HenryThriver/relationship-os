// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { serve, ServerRequest } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.31.0'
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.21.0'
import OpenAI from 'https://esm.sh/openai@4.68.0'

console.log("Hello from Functions!")

// =============================================================================
// AI MODEL CONFIGURATION
// =============================================================================
type AIProvider = 'openai' | 'claude' | 'google';
type ModelType = 'fast' | 'comprehensive';

interface ModelConfig {
  name: string;
  temperature: number;
  max_tokens?: number;
}

const AI_MODELS = {
  openai: {
    fast: {
      name: 'o4-mini',
      temperature: 0.2,
    },
    comprehensive: {
      name: 'gpt-4.1',
      temperature: 0.2,
    },
    reasoning: {
      name: 'o3',
      temperature: 0.2,
    }
  },
  claude: {
    fast: {
      name: 'claude-sonnet-4-20250514',
      temperature: 0.2,
      max_tokens: 20000
    },
    comprehensive: {
      name: 'claude-opus-4-20250514',
      temperature: 0.2,
      max_tokens: 20000
    }
  },
  google: {
    fast: {
      name: 'gemini-2.5-flash',
      temperature: 0.2,
      max_tokens: 4000
    },
    comprehensive: {
      name: 'gemini-2.5-pro',
      temperature: 0.2,
      max_tokens: 4000
    }
  }
};

// Default configurations for different task types
const TASK_MODELS = {
  // Quick analysis, simple extractions - now using Claude for consistency
  quick_analysis: { provider: 'claude' as AIProvider, model: 'fast' as ModelType },
  
  // Complex LinkedIn profile analysis, comprehensive extractions
  comprehensive_profile: { provider: 'claude' as AIProvider, model: 'fast' as ModelType },
  
  // Voice memo analysis - now using Claude for better analysis
  voice_analysis: { provider: 'claude' as AIProvider, model: 'comprehensive' as ModelType },
  
  // Meeting analysis - now using Claude for consistency
  meeting_analysis: { provider: 'claude' as AIProvider, model: 'fast' as ModelType },
  
  // Email analysis - now using Claude for consistency  
  email_analysis: { provider: 'claude' as AIProvider, model: 'fast' as ModelType },
  
  // Onboarding analysis - now using Claude for better analysis
  onboarding_analysis: { provider: 'claude' as AIProvider, model: 'comprehensive' as ModelType },
};

// =============================================================================
// UNIFIED AI CALLING FUNCTION
// =============================================================================
async function callAI(
  prompt: string, 
  provider: AIProvider, 
  modelType: ModelType
): Promise<string | null> {
  const modelConfig = AI_MODELS[provider][modelType];
  
  console.log(`Calling ${provider} ${modelConfig.name} for AI analysis`);
  
  try {
    if (provider === 'openai') {
      const apiKey = Deno.env.get('OPENAI_API_KEY');
      if (!apiKey) {
        console.error('OPENAI_API_KEY is not set in environment variables.');
        throw new Error('OpenAI API key is missing.');
      }

      const openai = new OpenAI({
        apiKey: apiKey,
      });

      const response = await openai.chat.completions.create({
        model: modelConfig.name,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" },
        temperature: modelConfig.temperature,
      });
      
      if (!response.choices || response.choices.length === 0 || !response.choices[0].message || !response.choices[0].message.content) {
        console.error('Invalid response structure from OpenAI:', response);
        return null;
      }
      
      return response.choices[0].message.content;

    } else if (provider === 'claude') {
      const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
      if (!apiKey) {
        console.error('ANTHROPIC_API_KEY is not set in environment variables.');
        throw new Error('Anthropic API key is missing.');
      }
      
      // Debug logging (temporary)
      console.log('Claude API key retrieved:', apiKey ? `${apiKey.substring(0, 7)}...` : 'null');
      console.log('API key length:', apiKey ? apiKey.length : 0);

      const anthropic = new Anthropic({
        apiKey: apiKey,
      });

      const message = await anthropic.messages.create({
        model: modelConfig.name,
        max_tokens: (modelConfig as any).max_tokens || 8000,
        temperature: modelConfig.temperature,
        messages: [{ role: 'user', content: prompt }]
      });
      
      if (!message.content || message.content.length === 0 || !message.content[0].text) {
        console.error('Invalid response structure from Claude:', message);
        return null;
      }
      
      return message.content[0].text;

    } else if (provider === 'google') {
      const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');
      if (!apiKey) {
        console.error('GOOGLE_AI_API_KEY is not set in environment variables.');
        throw new Error('Google AI API key is missing.');
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelConfig.name });

      const result = await model.generateContent({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: modelConfig.temperature,
          candidateCount: 1,
        }
      });

      const response = await result.response;
      const text = response.text();
      
      if (!text) {
        console.error('No text response from Google AI:', response);
        return null;
      }
      
      return text;

    } else {
      throw new Error(`Unsupported AI provider: ${provider}`);
    }

  } catch (error) {
    console.error(`Error calling ${provider} ${modelConfig.name}:`, error);
    return null;
  }
}

// Convenience function for task-based model selection
async function callAIForTask(prompt: string, taskType: keyof typeof TASK_MODELS): Promise<string | null> {
  const config = TASK_MODELS[taskType];
  return callAI(prompt, config.provider, config.model);
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to deduplicate arrays
function deduplicateArray(arr: any[]): any[] {
  if (!Array.isArray(arr)) return arr;
  
  // For arrays of strings, use Set for simple deduplication
  if (arr.length > 0 && typeof arr[0] === 'string') {
    return [...new Set(arr)];
  }
  
  // For arrays of objects, use JSON.stringify for comparison (not perfect but handles most cases)
  const seen = new Set();
  return arr.filter(item => {
    const key = typeof item === 'object' ? JSON.stringify(item) : item;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
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
      
      // Check if this is an onboarding voice memo
      // For profile_enhancement memos, we use the specialized parser regardless of is_self_contact
      // For other onboarding memos, we require is_self_contact to be true
      const isProfileEnhancement = fetchedArtifactRecord.metadata?.memo_type === 'profile_enhancement';
      const isOtherOnboardingMemo = contact.is_self_contact && 
                                   (fetchedArtifactRecord.metadata?.is_onboarding === 'true' || 
                                    fetchedArtifactRecord.metadata?.source === 'onboarding_voice_recorder');
      
      isOnboardingMemo = isProfileEnhancement || isOtherOnboardingMemo;
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
      aiParseResult = await parseWithAI(contentToAnalyze, contact, fetchedArtifactRecord);
    }

    if (aiParseResult === null) {
      console.error(`AI parsing failed for artifact ${fetchedArtifactRecord.id}. Parsing function returned null.`);
      await supabase.from('artifacts').update({ 
          ai_parsing_status: 'failed', 
          ai_processing_completed_at: new Date().toISOString() 
      }).eq('id', fetchedArtifactRecord.id);
      
      // Provide user-friendly error message for onboarding context
      if (isOnboardingMemo) {
        throw new Error('We had trouble processing your voice memo. Please try recording again - your message is important to us.');
      } else {
        throw new Error('AI processing failed. Please try again.');
      }
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
              const combinedArray = [...currentValue, ...suggested_value];
              contactUpdates[field_path] = deduplicateArray(combinedArray);
            } else if (action === 'add' && Array.isArray(contact[field_path])) {
              // For adding single values to arrays
              const currentValue = contactUpdates[field_path] || contact[field_path] || [];
              const combinedArray = [...currentValue, suggested_value];
              contactUpdates[field_path] = deduplicateArray(combinedArray);
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
              const combinedArray = [...currentValue, ...suggested_value];
              contactUpdates[parentField][childField] = deduplicateArray(combinedArray);
            } else if (action === 'add' && Array.isArray(contactUpdates[parentField]?.[childField] || contact[parentField]?.[childField])) {
              const currentValue = contactUpdates[parentField]?.[childField] || contact[parentField]?.[childField] || [];
              const combinedArray = [...currentValue, suggested_value];
              contactUpdates[parentField][childField] = deduplicateArray(combinedArray);
            } else {
              contactUpdates[parentField][childField] = suggested_value;
            }
          }
          
          directUpdatesApplied++;
          console.log(`Applied update: ${field_path} = ${JSON.stringify(suggested_value)}`);
        }
      }
      
      // Handle challenge feature mappings for onboarding memos
      const challengeFeatureMappings = aiParseResult.challenge_feature_mappings || [];
      if (challengeFeatureMappings.length > 0 && isOnboardingMemo) {
        // Only store high-confidence mappings
        const validMappings = challengeFeatureMappings.filter(mapping => mapping.confidence >= 0.7);
        if (validMappings.length > 0) {
          contactUpdates.challenge_feature_mappings = validMappings.map(mapping => ({
            challenge: mapping.challenge,
            featureKey: mapping.featureKey
          }));
          console.log(`Added ${validMappings.length} challenge-feature mappings to contact updates`);
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
    
    // For onboarding goal memos, create goal record in goals table
    if (isOnboardingMemo && (fetchedArtifactRecord.metadata?.memo_type === 'goal' || fetchedArtifactRecord.metadata?.memo_type === 'goals')) {
      try {
        // Extract goal information from AI results
        const goalTitle = aiParseResult.contact_updates.find(u => u.field_path === 'primary_goal')?.suggested_value;
        const goalDescription = aiParseResult.contact_updates.find(u => u.field_path === 'goal_description')?.suggested_value;
        const goalTimeline = aiParseResult.contact_updates.find(u => u.field_path === 'goal_timeline')?.suggested_value;
        const goalSuccessCriteria = aiParseResult.contact_updates.find(u => u.field_path === 'goal_success_criteria')?.suggested_value;
        const goalCategory = fetchedArtifactRecord.metadata?.goal_category || null;

        if (goalTitle) {
          // Create goal in new goals table
          const { data: newGoal, error: goalError } = await supabase
            .from('goals')
            .insert({
              user_id: userId,
              title: goalTitle,
              description: goalDescription,
              category: goalCategory,
              timeline: goalTimeline,
              success_criteria: goalSuccessCriteria,
              is_primary: true, // First goal from onboarding is primary
              voice_memo_id: fetchedArtifactRecord.id,
              created_from: 'onboarding',
              status: 'active'
            })
            .select()
            .single();

          if (goalError) {
            console.error('Error creating goal record:', goalError);
          } else {
            console.log(`Created goal record: ${newGoal.id} for user ${userId}`);
          }
        }
      } catch (error) {
        console.error('Error processing onboarding goal memo:', error);
        // Don't fail the whole process if goal creation fails
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
    
    // For profile enhancement voice memos, store the relationship summary in metadata
    if (fetchedArtifactRecord.type === 'voice_memo' && 
        fetchedArtifactRecord.metadata?.memo_type === 'profile_enhancement' && 
        aiParseResult.relationship_summary) {
      try {
        const currentMetadata = fetchedArtifactRecord.metadata || {};
        const updatedMetadata = {
          ...currentMetadata,
          relationship_summary: aiParseResult.relationship_summary
        };

        await supabase
          .from('artifacts')
          .update({ metadata: updatedMetadata })
          .eq('id', fetchedArtifactRecord.id);

        console.log(`Updated voice memo metadata with relationship summary for artifact ${fetchedArtifactRecord.id}`);
      } catch (error) {
        console.error('Error updating voice memo metadata with relationship summary:', error);
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
    
    // Provide user-friendly error messages
    let userFriendlyMessage = error.message;
    
    // If the error message doesn't seem user-friendly, provide a generic one
    if (!userFriendlyMessage || 
        userFriendlyMessage.includes('fetch') || 
        userFriendlyMessage.includes('JSON') ||
        userFriendlyMessage.includes('<!DOCTYPE') ||
        userFriendlyMessage.includes('undefined') ||
        userFriendlyMessage.includes('null') ||
        userFriendlyMessage.toLowerCase().includes('unexpected token')) {
      userFriendlyMessage = 'We encountered an issue processing your recording. Please try again in a few moments.';
    }
    
    return new Response(JSON.stringify({ 
      error: userFriendlyMessage,
      timestamp: new Date().toISOString()
    }), { 
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

interface ChallengeFeatureMapping {
  challenge: string;
  featureKey: string;
  confidence: number;
  reasoning: string;
}

interface AiParseResult {
  contact_updates: AiSuggestion[];
  suggested_loops: SuggestedLoop[];
  challenge_feature_mappings?: ChallengeFeatureMapping[];
  relationship_summary?: string;
}

// Master features configuration for LLM-driven feature mapping
const CULTIVATE_FEATURES = [
  {
    key: 'contact_intelligence',
    title: 'AI-Powered Contact Intelligence',
    description: 'Automatically capture and organize every detail about your contacts - names, interests, family details, preferences, and conversation history - so you never forget again.',
    category: 'intelligence',
    relevantFor: ['memory', 'details', 'names', 'faces', 'information', 'forgetting', 'remembering']
  },
  {
    key: 'follow_up_automation',
    title: 'Smart Follow-up Automation',
    description: 'Get personalized follow-up suggestions, with draft messages written in your voice based on your conversation and mutual interests.',
    category: 'automation',
    relevantFor: ['follow-up', 'next steps', 'staying in touch', 'after meeting', 'introductions']
  },
  {
    key: 'relationship_maintenance',
    title: 'Relationship Maintenance System',
    description: 'Automated reminders and suggested touchpoints to maintain consistent communication with your network based on relationship importance and timing.',
    category: 'automation',
    relevantFor: ['consistent', 'outreach', 'system', 'routine', 'maintaining', 'staying connected']
  },
  {
    key: 'generosity_first_networking',
    title: 'Generosity-First Networking',
    description: 'Get suggestions for ways to help others first - introductions you can make, resources you can share, and opportunities you can offer before asking for anything.',
    category: 'strategy',
    relevantFor: ['guilty', 'reaching out', 'need something', 'selfish', 'asking for help', 'giving value']
  },
  {
    key: 'conversation_intelligence',
    title: 'Conversation Intelligence',
    description: 'Pre-meeting research and conversation starters based on shared interests, recent activities, and mutual connections to make networking feel natural.',
    category: 'communication',
    relevantFor: ['awkward', 'uncomfortable', 'drained', 'conversation', 'events', 'talking', 'small talk']
  },
  {
    key: 'personal_brand_discovery',
    title: 'Personal Brand Discovery',
    description: 'Identify and articulate your unique value proposition, expertise areas, and the specific ways you can help others in your network.',
    category: 'strategy',
    relevantFor: ['confident', 'offer', 'value', 'what to say', 'unique', 'expertise', 'positioning']
  },
  {
    key: 'strategic_networking_roadmap',
    title: 'Strategic Networking Roadmap',
    description: 'Get a personalized action plan with prioritized next steps, key connections to make, and clear milestones toward your networking goals.',
    category: 'strategy',
    relevantFor: ['overwhelmed', 'where to start', 'don\'t know', 'strategy', 'plan', 'goals', 'direction']
  },
  {
    key: 'relationship_analytics',
    title: 'Relationship Analytics & Insights',
    description: 'Track the health and growth of your professional relationships with insights on engagement patterns, communication frequency, and relationship strength.',
    category: 'intelligence',
    relevantFor: ['track', 'measure', 'analytics', 'insights', 'progress', 'effectiveness']
  },
  {
    key: 'smart_introductions',
    title: 'Smart Introduction Engine',
    description: 'Automatically identify and facilitate valuable introductions within your network, creating win-win connections that benefit everyone involved.',
    category: 'automation',
    relevantFor: ['introductions', 'connecting people', 'networking', 'mutual benefit', 'relationships']
  },
  {
    key: 'context_preservation',
    title: 'Context Preservation System',
    description: 'Never lose track of important relationship context - automatically capture meeting notes, shared documents, and conversation history across all touchpoints.',
    category: 'intelligence',
    relevantFor: ['context', 'history', 'notes', 'meetings', 'documents', 'tracking', 'organization']
  }
];

// Helper function to create feature mapping context for LLM
function createFeatureMappingContext(): string {
  return CULTIVATE_FEATURES.map(feature => 
    `${feature.key}: ${feature.title} - ${feature.description}`
  ).join('\n');
}

async function parseWithAI(transcription: string, contact: any, fetchedArtifactRecord: any): Promise<AiParseResult | null> {
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
CRITICAL: Return ONLY the JSON object below. Do NOT wrap it in markdown code blocks or any other formatting. Do NOT include triple backticks or json markers.

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
    // Determine the appropriate task type based on artifact type
    let taskType: keyof typeof TASK_MODELS;
    if (isMeeting) {
      taskType = 'meeting_analysis';
    } else if (isEmail) {
      taskType = 'email_analysis';
    } else if (isVoiceMemo) {
      taskType = 'voice_analysis';
    } else {
      taskType = 'quick_analysis'; // Default for linkedin_post and other types
    }
    
    const aiResponse = await callAIForTask(promptContent, taskType);
    
    if (!aiResponse) {
      console.error('No response from AI service');
      return null;
    }

    console.log(`AI Response for ${taskType}:`, aiResponse);

    try {
      // Strip markdown code blocks if present
      let cleanedResponse = aiResponse.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const parsedResult = JSON.parse(cleanedResponse) as AiParseResult;
      // Validate structure further if needed
      if (typeof parsedResult.contact_updates === 'undefined' || typeof parsedResult.suggested_loops === 'undefined') {
          console.error('AI response missing contact_updates or suggested_loops key:', parsedResult);
          // Attempt to salvage if one part is present
          return {
            contact_updates: parsedResult.contact_updates || [],
            suggested_loops: parsedResult.suggested_loops || [],
          };
      }
      return parsedResult;
    } catch (e) {
      console.error('Error parsing AI JSON response:', e, aiResponse);
      return null; // Or throw e to indicate parsing failure
    }

  } catch (error) {
    console.error('Error in parseWithAI:', error);
    // Do not throw here, let the caller handle the null response and update artifact status
    return null; 
  }
}

async function parseSelfLinkedInProfile(profileContent: string, contact: any, metadata: any): Promise<AiParseResult | null> {
  // Get ALL user's LinkedIn posts for comprehensive analysis
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  const { data: allPosts, error: postsError } = await supabase
    .from('artifacts')
    .select('content, metadata, created_at')
    .eq('contact_id', contact.id)
    .eq('type', 'linkedin_post')
    .order('created_at', { ascending: false });

  if (postsError) {
    console.error('Error fetching LinkedIn posts:', postsError);
  }

  // Format comprehensive posts data for analysis
  const postsAnalysisContent = allPosts?.map(post => {
    const meta = post.metadata || {};
    const postContent = meta.content || post.content || '';
    const engagement = meta.engagement || {};
    const hashtags = meta.hashtags || [];
    const mentions = meta.mentions || [];
    const postType = meta.post_type || 'post';
    
    return `
POST ${post.created_at} (${postType}):
Content: ${postContent}
Hashtags: ${hashtags.join(', ')}
Mentions: ${mentions.join(', ')}
Engagement: ${engagement.likes || 0} likes, ${engagement.comments || 0} comments, ${engagement.shares || 0} shares
Total Engagement: ${engagement.totalEngagement || 0}
---`;
  }).join('\n\n') || 'No LinkedIn posts available for analysis.';

  const promptContent = `
COMPREHENSIVE PROFESSIONAL PROFILE ANALYSIS
Analyzing LinkedIn Profile + All LinkedIn Posts for Complete Professional Intelligence

User Name: ${contact.name || 'User'}
Current User Profile (JSON): 
${JSON.stringify({
  professional_context: contact.professional_context || {},
  personal_context: contact.personal_context || {},
  ways_to_help_others: contact.ways_to_help_others || [],
  introduction_opportunities: contact.introduction_opportunities || [],
  knowledge_to_share: contact.knowledge_to_share || [],
  networking_challenges: contact.networking_challenges || [],
  primary_goal: contact.primary_goal || null,
  goal_description: contact.goal_description || null,
  challenge_feature_mappings: contact.challenge_feature_mappings || []
}, null, 2)}

=== LINKEDIN PROFILE DATA ===
${profileContent}

=== ALL LINKEDIN POSTS DATA ===
${postsAnalysisContent}

COMPREHENSIVE ANALYSIS INSTRUCTIONS:
You are analyzing BOTH the LinkedIn profile AND all LinkedIn posts to create a complete professional profile. Both sources are equally important - the profile provides structured professional background, while the posts reveal authentic voice, interests, values, and current thinking.

TONE & LANGUAGE GUIDELINES:
- Use PROFESSIONAL, GROUNDED language - avoid hyperbolic terms
- AVOID: "visionary", "profound", "pioneering", "revolutionary", "groundbreaking", "exceptional"
- PREFER: "experienced", "skilled", "focused", "knowledgeable", "accomplished", "effective"
- Base insights on OBSERVABLE FACTS from both profile and posts
- Write professionally but authentically

COMPREHENSIVE ANALYSIS FOCUS:

1. PROFESSIONAL BRIEF & PERSONAL BRAND (Profile + Posts)
   - Professional narrative from experience AND current thinking in posts
   - Value proposition from background AND demonstrated expertise in posts
   - Communication style from formal profile AND authentic voice in posts
   - Professional focus areas from structured data AND post themes

2. EXPERTISE & THOUGHT LEADERSHIP (Profile + Posts)
   - Core competencies from experience AND knowledge demonstrated in posts
   - Specialization areas from background AND topics discussed in posts
   - Industry insights from structured data AND opinions shared in posts
   - Thought leadership topics from both formal credentials AND post engagement

3. PERSONAL INTERESTS & VALUES (Profile + Posts)
   - Personal interests from About section AND interests revealed in posts
   - Hobbies and activities from profile AND lifestyle content in posts
   - Values from formal statements AND authentic expressions in posts
   - Personal passions from both structured data AND engaged post topics

4. NETWORKING & RELATIONSHIP BUILDING (Profile + Posts)
   - Ways to help others from experience AND value offered in posts
   - Introduction opportunities from background AND connections revealed in posts
   - Knowledge to share from credentials AND expertise demonstrated in posts
   - Communication preferences from formal style AND authentic voice in posts

5. CURRENT PROFESSIONAL CONTEXT (Profile + Posts)
   - Career positioning from structured data AND recent updates in posts
   - Strategic interests from background AND current focus in posts
   - Professional development from credentials AND learning shared in posts
   - Industry positioning from formal role AND thought leadership in posts

6. AUTHENTIC VOICE & COMMUNICATION (Posts Primary)
   - Writing style and tone from post content
   - Key messaging themes from recurring post topics
   - Professional personality from authentic post voice
   - Content preferences from post types and engagement patterns

7. PERSONAL & PROFESSIONAL INTERESTS (CRITICAL - COMPREHENSIVE EXTRACTION)
   - **MANDATORY**: Extract ALL personal interests mentioned ANYWHERE in the profile data
   - **ABOUT SECTION**: Scan thoroughly for personal mentions like "exploring nature", "learning guitar", "writing about human thriving", family references, travel, hobbies
   - **EXPERIENCE DESCRIPTIONS**: Look for personal interests mentioned in job descriptions or company descriptions
   - **LINKEDIN POSTS**: Identify personal interests revealed through posts (family, travel, hobbies, sports, music, reading, volunteering, etc.)
   - **HASHTAGS & CONTENT**: Analyze post hashtags and content for personal interest indicators
   - **VALUES & PHILOSOPHY**: Extract values and life philosophies from any source
   - **LIFESTYLE INDICATORS**: Look for lifestyle content, personal challenges, family mentions, outdoor activities, creative pursuits
   - **CRITICAL**: Do NOT focus only on professional content - actively seek personal elements

COMPREHENSIVE FIELD MAPPING:

PROFESSIONAL BRIEF & BRAND:
- "professional_context.professional_brief" (string - comprehensive 2-3 paragraph narrative from profile + posts)
- "professional_context.unique_value_proposition" (string - from experience + demonstrated value in posts)
- "professional_context.personal_brand_pillars" (array - 3-5 core elements from both sources)
- "professional_context.zone_of_genius" (string - primary expertise area from both sources)

EXPERTISE & KNOWLEDGE:
- "professional_context.expertise_areas" (array - from experience + demonstrated expertise in posts)
- "professional_context.thought_leadership_topics" (array - from background + post topics)
- "professional_context.industry_insights" (array - from both formal and post insights)
- "professional_context.core_competencies" (array - from credentials + demonstrated skills)

COMMUNICATION & VOICE:
- "professional_context.communication_style" (string - from formal profile + authentic post voice)
- "professional_context.writing_voice" (string - primarily from post analysis)
- "professional_context.key_messaging_themes" (array - recurring themes from posts)
- "professional_context.content_preferences" (array - types of content they create/engage with)

NETWORKING CAPABILITIES:
- "ways_to_help_others" (array - from experience + value offered in posts)
- "introduction_opportunities" (array - from background + connections in posts)
- "knowledge_to_share" (array - from credentials + expertise shared in posts)

PERSONAL INTERESTS & VALUES:
- "personal_context.interests" (array - ALL personal interests from ANY source)
- "personal_context.hobbies" (array - hobbies from profile + posts)
- "personal_context.values" (array - values from formal statements + authentic expressions)
- "personal_context.motivations" (array - personal motivations from both sources)
- "personal_context.family" (string - family references from any source)
- "personal_context.travel_interests" (array - travel interests from either source)
- "personal_context.volunteer_activities" (array - volunteer work from either source)
- "personal_context.personal_philosophy" (string - values/philosophy from both sources)

PROFESSIONAL POSITIONING:
- "professional_context.career_trajectory" (string - from structured experience + current direction in posts)
- "professional_context.strategic_interests" (array - from background + current focus in posts)
- "professional_context.growth_areas" (array - from formal development + learning in posts)
- "professional_context.industry_positioning" (string - from role + thought leadership in posts)

BASIC PROFILE UPDATES:
- "company" (string - from profile data)
- "title" (string - from profile data)
- "profile_picture" (string - from LinkedIn profile picture URL)
- "location" (string - from profile data)

CRITICAL ANALYSIS REQUIREMENTS:
1. TREAT BOTH SOURCES EQUALLY - Don't just use posts for "voice analysis"
2. **EXTRACT ALL PERSONAL INTERESTS** - This is MANDATORY. Look for:
   - Hobbies: "learning guitar", music, sports, creative pursuits
   - Family: "exploring nature with my family", family time, family activities
   - Outdoor activities: nature, hiking, exploring, outdoor sports
   - Personal passions: "writing about human thriving", personal development
   - Travel interests, volunteer work, personal philosophy, values
   - ANY non-professional content mentioned ANYWHERE in the data
3. IDENTIFY VALUES AND MOTIVATIONS from both formal statements and authentic posts
4. MAP PROFESSIONAL EXPERTISE from both credentials and demonstrated knowledge
5. CAPTURE AUTHENTIC VOICE from comprehensive post analysis
6. ENSURE COMPREHENSIVE PERSONAL CONTEXT extraction - DO NOT leave personal_context empty
7. Only include updates with confidence >= 0.7
8. Be specific and actionable - ground insights in observable facts
9. Focus on practical relationship-building value including personal connection points
10. Return empty suggested_loops array (self-analysis)
11. **PERSONAL INTERESTS ARE CRITICAL** - If you find NO personal interests, re-read the About section more carefully

RESPONSE FORMAT (JSON Object):
CRITICAL: Return ONLY the JSON object below. Do NOT wrap it in markdown code blocks or any other formatting. Do NOT include triple backticks or json markers.

{
  "contact_updates": [
    {
      "field_path": "professional_context.professional_brief",
      "action": "update",
      "suggested_value": "Comprehensive professional narrative here...",
      "confidence": 0.9,
      "reasoning": "Based on comprehensive analysis of LinkedIn profile and posts."
    },
    {
      "field_path": "personal_context.interests",
      "action": "add",
      "suggested_value": "Marathon running",
      "confidence": 0.8,
      "reasoning": "Mentioned training for marathons in About section and multiple posts about running."
    }
  ],
  "suggested_loops": []
}

Generate a comprehensive profile that captures both their professional credentials AND their authentic voice, interests, and values as revealed through their complete LinkedIn presence.
`;

  try {
    const aiResponse = await callAIForTask(promptContent, 'comprehensive_profile');
    
    if (!aiResponse) {
      console.error('No response from AI service for self LinkedIn analysis');
      return null;
    }
    
    console.log(`Self LinkedIn comprehensive profile analysis:`, aiResponse);

    try {
      // Strip markdown code blocks if present
      let cleanedResponse = aiResponse.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const parsedResult = JSON.parse(cleanedResponse) as AiParseResult;
      return {
        contact_updates: parsedResult.contact_updates || [],
        suggested_loops: parsedResult.suggested_loops || [], // Should be empty for self-analysis
      };
    } catch (e) {
      console.error('Error parsing AI JSON response for self LinkedIn analysis:', e, aiResponse);
      return null;
    }

  } catch (error) {
    console.error('Error in parseSelfLinkedInProfile:', error);
    return null; 
  }
}

async function parseOnboardingVoiceMemo(transcription: string, contact: any, metadata: any): Promise<AiParseResult | null> {
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

CULTIVATE HQ FEATURES AVAILABLE:
${createFeatureMappingContext()}

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
CRITICAL: Return ONLY the JSON object below. Do NOT wrap it in markdown code blocks or any other formatting. Do NOT include triple backticks or json markers.

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
  "suggested_loops": [],
  "challenge_feature_mappings": [
    {
      "challenge": "Difficulty following up after networking events",
      "featureKey": "follow_up_automation",
      "confidence": 0.95,
      "reasoning": "This challenge directly aligns with Smart Follow-up Automation which provides personalized follow-up suggestions within 24 hours."
    }
  ]
}

IMPORTANT: For each networking challenge identified, you MUST also create a corresponding challenge_feature_mappings entry that maps the challenge to the most relevant Cultivate HQ feature from the list above. Choose the feature that most directly addresses or solves that specific challenge.

Focus on extracting the user's own challenges, goals, strengths, and areas for improvement. Do not extract information about other people mentioned in the transcript.
Only include updates with confidence >= 0.6.
Return empty suggested_loops array as this is about self-reflection, not relationship loops with others.
`;
  } else if (memoType === 'goal' || memoType === 'goals') {
    const goalCategory = metadata?.goal_category || null;
    
    promptContent = `
USER PROFILE EXTRACTION - GOAL SETTING ANALYSIS

User Name: ${contact.name || 'User'}
Goal Category Selected: ${goalCategory || 'General'}
Current User Profile (JSON): 
${JSON.stringify({
  professional_context: contact.professional_context || {},
  personal_context: contact.personal_context || {},
  primary_goal: contact.primary_goal || null,
  goal_description: contact.goal_description || null,
  goal_timeline: contact.goal_timeline || null,
  goal_success_criteria: contact.goal_success_criteria || null
}, null, 2)}

Voice Memo Transcription (User describing their professional goals and aspirations): 
"${transcription}"

EXTRACTION INSTRUCTIONS:
You are analyzing a voice memo where the USER is describing their professional goals and what they want to achieve through networking and relationship building. This follows a "magic wand" framing - they're describing what success looks and feels like.

Extract detailed goal information and associated context that will help personalize their relationship intelligence dashboard.

PRIORITY FIELD PATHS FOR GOAL EXTRACTION:
GOAL DEFINITION:
- "primary_goal" (string - their main professional/networking goal, be specific)
- "goal_description" (string - detailed description of what they want to achieve, include their vision of success)
- "goal_timeline" (string - when they want to achieve this, extract timeframes mentioned)
- "goal_success_criteria" (string - how they'll know they've succeeded, what success looks and feels like)

SUPPORTING CONTEXT:
- "professional_context.career_goals" (array of strings - specific career objectives, action: 'add')
- "professional_context.aspirations" (array of strings - professional aspirations mentioned, action: 'add')
- "professional_context.challenges_to_overcome" (array of strings - obstacles they need to overcome, action: 'add')
- "ways_to_help_others" (array of strings - how achieving their goal will help them serve others, action: 'add')

PERSONAL MOTIVATION:
- "personal_context.motivations" (array of strings - what drives them toward this goal, action: 'add')
- "personal_context.values" (array of strings - values that align with their goal, action: 'add')

RESPONSE FORMAT (JSON Object):
CRITICAL: Return ONLY the JSON object below. Do NOT wrap it in markdown code blocks or any other formatting. Do NOT include triple backticks or json markers.

{
  "contact_updates": [
    {
      "field_path": "primary_goal",
      "action": "update",
      "suggested_value": "Land a VP of Product role at a Series B+ startup in the health tech space within 12 months",
      "confidence": 0.95,
      "reasoning": "User clearly stated this specific role and timeline as their main objective."
    },
    {
      "field_path": "goal_description", 
      "action": "update",
      "suggested_value": "I want to lead product strategy for a health tech company that's making a real impact on patient outcomes. Success means having a team of 8-12 PMs, driving product decisions that affect millions of users, and being recognized as a thought leader in health tech product development.",
      "confidence": 0.9,
      "reasoning": "User described their vision of success including team size, impact, and recognition goals."
    }
  ],
  "suggested_loops": []
}

Focus on extracting specific, actionable goal information that will drive personalized networking recommendations.
Be thorough with goal_description - capture their vision of what success looks and feels like.
Only include updates with confidence >= 0.7 for goals (higher bar than challenges).
Return empty suggested_loops array as this is about self-reflection and goal setting.
`;
  } else if (memoType === 'profile_enhancement') {
    // Extract LinkedIn URL from metadata if available
    const linkedinUrl = metadata?.linkedin_url || 'unknown contact';
    
    promptContent = `
CONTACT RELATIONSHIP ANALYSIS - PROFILE ENHANCEMENT

User Name: ${contact.name || 'User'}
LinkedIn URL Being Added: ${linkedinUrl}
Current User Profile (JSON): 
${JSON.stringify({
  professional_context: contact.professional_context || {},
  personal_context: contact.personal_context || {},
  primary_goal: contact.primary_goal || null,
  goal_description: contact.goal_description || null
}, null, 2)}

Voice Memo Transcription (User describing their relationship with this contact and relevance to their goal): 
"${transcription}"

EXTRACTION INSTRUCTIONS:
You are analyzing a voice memo where the USER is describing their relationship with a specific contact they're adding to their goal. They're explaining how they know this person (if at all) and why they think this contact is relevant to achieving their goal.

This is NOT about updating the user's profile - this is about extracting insights about the RELATIONSHIP between the user and this contact that will be used to enhance relationship intelligence.

ANALYSIS FOCUS:
1. How does the user know this contact? (professional relationship, personal connection, mutual connections, etc.)
2. What makes this contact relevant to the user's goal?
3. What value could this contact provide? (advice, connections, opportunities, etc.)
4. What value could the user provide to this contact?
5. Current relationship status and interaction history

RELATIONSHIP SUMMARY:
Create a concise 2-3 sentence summary of the key relationship context that captures:
- How they know each other
- The contact's professional background/expertise
- Why this contact is relevant to the user's goal
- Any notable characteristics or connection strengths

RESPONSE FORMAT (JSON Object):
CRITICAL: Return ONLY the JSON object below. Do NOT wrap it in markdown code blocks or any other formatting. Do NOT include triple backticks or json markers.

{
  "contact_updates": [],
  "suggested_loops": [
    {
      "type": "advice_request",
      "title": "Seek career advice from [Contact Name]",
      "description": "Reach out to [Contact Name] for insights on breaking into the health tech space, given their experience at [Company] and expertise in [Area].",
      "current_status": "idea",
      "reciprocity_direction": "receiving",
      "confidence": 0.8,
      "reasoning": "User mentioned this contact has relevant experience and could provide valuable guidance for their career transition."
    }
  ],
  "relationship_summary": "Met through GSB MSX program. Israeli VC investing in AI/data startups and developer tools. Also works as CRO/sales operator and is technical (interested in voice agents). Active on LinkedIn, well-connected in multiple spaces. Could be supportive for goal achievement given network and expertise overlap."
}

Focus on generating actionable relationship loops based on the relationship context provided.
The contact_updates array should be empty since this memo is about relationship context, not user profile updates.
Generate 1-3 suggested loops based on the relationship dynamics and relevance to the user's goal.
Only include loops with confidence >= 0.7.
`;
  } else {
    // General onboarding memo prompt (for other types like profile setup, etc.)
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
Extract information about the USER THEMSELVES from this onboarding voice memo. Focus on their professional background, personal interests, and how they want to use this relationship management system.

VALID FIELD PATHS FOR USER PROFILE UPDATES:
[Use the same field paths as the challenges prompt above]

Focus on building a comprehensive profile of the user themselves.
Only include updates with confidence >= 0.6.
Return empty suggested_loops array for onboarding memos.
`;
  }

  try {
    console.log('Making AI API request for onboarding memo using centralized config...');
    
    // Use centralized AI configuration instead of direct OpenAI calls
    const aiResponse = await callAIForTask(promptContent, 'onboarding_analysis');
    
    if (!aiResponse) {
      console.error('No response from AI service');
      throw new Error('AI processing returned an unexpected response format. Please try again.');
    }

    console.log(`AI response received successfully for onboarding memo`);
    console.log("Onboarding memo AI response content:", aiResponse);

    try {
      // Strip markdown code blocks if present
      let cleanedResponse = aiResponse.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const parsedResult = JSON.parse(cleanedResponse) as AiParseResult;
      console.log('Successfully parsed AI response:', parsedResult);
      return {
        contact_updates: parsedResult.contact_updates || [],
        suggested_loops: parsedResult.suggested_loops || [], // Should be empty for onboarding
        challenge_feature_mappings: parsedResult.challenge_feature_mappings || [],
        relationship_summary: parsedResult.relationship_summary || null,
      };
    } catch (e) {
      console.error('Error parsing AI JSON response for onboarding memo:', e);
      console.error('Raw response content:', aiResponse);
      throw new Error('AI processing returned an invalid format. Please try recording your message again.');
    }

  } catch (error) {
    console.error('Error in parseOnboardingVoiceMemo:', error);
      
    // If it's already a user-friendly error, re-throw it
    if (error.message.includes('AI processing') || error.message.includes('try again')) {
      throw error;
    }
      
    // Otherwise, provide a generic user-friendly message
    throw new Error('Unable to process your voice memo at this time. Please try again in a few moments.');
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
