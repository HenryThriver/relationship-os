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
    
    // Only process voice memos with completed transcriptions and pending AI parsing
    // Use fetchedArtifactRecord instead of 'record'
    if (
      fetchedArtifactRecord.type !== 'voice_memo' || 
      !fetchedArtifactRecord.transcription || 
      fetchedArtifactRecord.transcription_status !== 'completed' ||
      fetchedArtifactRecord.ai_parsing_status !== 'pending'
    ) {
      console.log(`Skipping parsing for artifact ${fetchedArtifactRecord.id}: Type: ${fetchedArtifactRecord.type}, Transcription Status: ${fetchedArtifactRecord.transcription_status}, AI Parsing Status: ${fetchedArtifactRecord.ai_parsing_status}`);
      return new Response(JSON.stringify({ message: 'Artifact not ready for parsing or already processed/skipped.' }), { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
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

    // Call OpenAI for parsing
    // The response from parseWithOpenAI will now be an object: { contact_updates: [], suggested_loops: [] }
    const aiParseResult = await parseWithOpenAI(fetchedArtifactRecord.transcription, contact);

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

    // Store contact update suggestions (if any)
    if (contactUpdateSuggestions.length > 0) {
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

async function parseWithOpenAI(transcription: string, contact: any): Promise<AiParseResult | null> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    console.error('OPENAI_API_KEY is not set in environment variables.');
    throw new Error('OpenAI API key is missing.');
  }

  const LOOP_DETECTION_PROMPT_SNIPPET = `
In addition to contact updates, analyze this transcription for potential relationship loops (ongoing multi-step interactions).

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

Voice Memo Transcription: 
"${transcription}"

EXTRACTION INSTRUCTIONS:
You are an expert relationship intelligence analyst. 
1. Extract ALL meaningful updates from this voice memo for the contact's profile. Be thorough.
2. ${LOOP_DETECTION_PROMPT_SNIPPET}

VALID FIELD PATHS FOR CONTACT UPDATES:
PERSONAL CONTEXT:
- "personal_context.family.partner" (object: { "name": "string", "relationship": "partner" | "spouse" | etc., "details"?: "string" }, action: 'update' to replace the entire object)
- "personal_context.family.children" (array of objects: [{ "name": "string", "relationship": "child" | "son" | "daughter", "details"?: "string" }], action: 'add' for each new child object)
- "personal_context.key_life_events" (array of strings - major transitions, moves, milestones, action: 'add')
- "personal_context.current_challenges" (array of strings - personal challenges they're facing, action: 'add')
- "personal_context.upcoming_changes" (array of strings - planned moves, transitions, action: 'add')
- "personal_context.living_situation" (string)
- "personal_context.interests" (array of strings, action: 'add')
- "personal_context.hobbies" (array of strings, action: 'add')
- "personal_context.travel_plans" (array of strings, action: 'add')
- "personal_context.values" (array of strings, action: 'add')
- "personal_context.motivations" (array of strings, action: 'add')
- "personal_context.communication_style" (string)
- "personal_context.education" (array of strings, action: 'add')

PROFESSIONAL CONTEXT:
- "company" (string)
- "title" (string)
- "professional_context.current_role.responsibilities" (array of strings, action: 'add')
- "professional_context.current_role.projects" (array of objects: [{ "name": "string", "status": "active" | "completed" | "planned", "details"?: "string" }], action: 'add')
- "professional_context.current_role.key_achievements" (array of strings, action: 'add')
- "professional_context.team.manager" (string)
- "professional_context.team.direct_reports" (array of strings, action: 'add')
- "professional_context.industry_insights" (array of strings, action: 'add')
- "professional_context.career_goals" (array of strings, action: 'add')
- "professional_context.professional_development" (array of strings, action: 'add')
- "professional_context.networking_activities" (array of strings, action: 'add')

GENERAL FIELDS:
- "name" (string, if a correction or full name is mentioned)
- "email" (string, if mentioned as primary or update)
- "phone" (string, if mentioned)
- "linkedin_url" (string, if mentioned)
- "location.city" (string)
- "location.state" (string)
- "location.country" (string)
- "next_steps" (array of strings for general todos related to this contact, action: 'add')
- "summary_of_conversation" (string, brief overview of key topics discussed)
- "key_pain_points_discussed" (array of strings, action: 'add')
- "opportunities_identified" (array of strings, action: 'add')
- "shared_interests_discovered" (array of strings, action: 'add')

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

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/parse-voice-memo' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
