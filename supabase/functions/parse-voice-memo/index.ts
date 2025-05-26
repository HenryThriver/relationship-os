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
    const suggestions = await parseWithOpenAI(fetchedArtifactRecord.transcription, contact);

    if (suggestions === null) { // Explicitly check for null
      console.error(`AI parsing failed for artifact ${fetchedArtifactRecord.id}. parseWithOpenAI returned null.`);
      await supabase.from('artifacts').update({ 
          ai_parsing_status: 'failed', 
          ai_processing_completed_at: new Date().toISOString() 
      }).eq('id', fetchedArtifactRecord.id);
      // Ensure the catch block below gets this error to return a proper 500 response
      throw new Error('AI parsing failed, parseWithOpenAI returned null.'); 
    }

    if (suggestions.length === 0) {
      await supabase
        .from('artifacts')
        .update({ 
          ai_parsing_status: 'completed', 
          ai_processing_completed_at: new Date().toISOString() 
        })
        .eq('id', fetchedArtifactRecord.id);
      
      console.log(`No suggestions found for artifact ${fetchedArtifactRecord.id}. Marked as completed.`);
      return new Response(JSON.stringify({ success: true, message: 'No suggestions generated.', suggestions_count: 0 }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Store suggestions
    const { error: insertSuggestionsError } = await supabase
      .from('contact_update_suggestions')
      .insert({
        artifact_id: fetchedArtifactRecord.id,
        contact_id: fetchedArtifactRecord.contact_id,
        user_id: contact.user_id,
        suggested_updates: { suggestions },
        field_paths: suggestions.map(s => s.field_path),
        confidence_scores: Object.fromEntries(suggestions.map(s => [s.field_path, s.confidence]))
      });

    if (insertSuggestionsError) {
      console.error(`Error inserting suggestions for artifact ${fetchedArtifactRecord.id}:`, insertSuggestionsError);
      await supabase.from('artifacts').update({ ai_parsing_status: 'failed', ai_processing_completed_at: new Date().toISOString() }).eq('id', fetchedArtifactRecord.id);
      throw new Error(`Failed to store suggestions: ${insertSuggestionsError.message}`);
    }
    
    console.log(`${suggestions.length} suggestions stored for artifact ${fetchedArtifactRecord.id}.`);

    // Update artifact status to 'completed'
    const { error: updateToCompletedError } = await supabase
      .from('artifacts')
      .update({ 
        ai_parsing_status: 'completed',
        ai_processing_completed_at: new Date().toISOString() // Set completion time
      })
      .eq('id', fetchedArtifactRecord.id);

    if (updateToCompletedError) {
      console.error(`Error updating artifact ${fetchedArtifactRecord.id} to completed status after storing suggestions:`, updateToCompletedError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `${suggestions.length} suggestions stored.`,
      suggestions_count: suggestions.length 
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

async function parseWithOpenAI(transcription: string, contact: any): Promise<Array<{field_path: string; action: 'add' | 'update' | 'remove'; suggested_value: any; confidence: number; reasoning: string}> | null> {
  // Ensure OPENAI_API_KEY is available
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    console.error('OPENAI_API_KEY is not set in environment variables.');
    throw new Error('OpenAI API key is missing.');
  }

  const promptContent = `
RELATIONSHIP INTELLIGENCE EXTRACTION

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

You are an expert relationship intelligence analyst. Extract ALL meaningful updates from this voice memo that would help build a comprehensive profile of this contact. Be thorough and systematic - capture both explicit statements and reasonable inferences.

VALID FIELD PATHS:

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
- "professional_context.current_role_description" (string)
- "professional_context.key_responsibilities" (array of strings, action: 'add')
- "professional_context.team_details" (string)
- "professional_context.work_challenges" (array of strings, action: 'add')
- "professional_context.goals" (array of strings, action: 'add')
- "professional_context.networking_objectives" (array of strings, action: 'add')
- "professional_context.skill_development" (array of strings, action: 'add')
- "professional_context.career_transitions" (array of strings, action: 'add')
- "professional_context.projects_involved" (array of strings, action: 'add')
- "professional_context.collaborations" (array of strings, action: 'add')
- "professional_context.upcoming_projects" (array of strings, action: 'add')
- "professional_context.skills" (array of strings, action: 'add')
- "professional_context.expertise_areas" (array of strings, action: 'add')
- "professional_context.industry_knowledge" (array of strings, action: 'add')
- "professional_context.mentions.colleagues" (array of strings, action: 'add')
- "professional_context.mentions.clients" (array of strings, action: 'add')
- "professional_context.mentions.competitors" (array of strings, action: 'add')
- "professional_context.mentions.collaborators" (array of strings, action: 'add')
- "professional_context.mentions.mentors" (array of strings, action: 'add')
- "professional_context.mentions.industry_contacts" (array of strings, action: 'add')

RELATIONSHIP & LOOP CONTEXT:
- "professional_context.opportunities_to_help" (array of strings - ways you could add value, action: 'add')
- "professional_context.introduction_needs" (array of strings - people they need to meet, action: 'add')
- "professional_context.resource_needs" (array of strings - info/tools they need, action: 'add')
- "professional_context.pending_requests" (array of strings - things you've asked them to do, action: 'add')
- "professional_context.collaboration_opportunities" (array of strings, action: 'add')

EXTRACTION RULES:

1. COMPREHENSIVE CAPTURE: Extract every piece of information that adds to understanding this person
2. INFER INTELLIGENTLY: Include reasonable inferences from context (e.g., if they mention "my wife Sarah," extract partner name: "Sarah")
3. PRESERVE NUANCE: Capture the emotional context and implications, not just facts
4. IDENTIFY OPPORTUNITIES: Look for ways you could add value or areas for collaboration
5. TRACK COMMITMENTS: Note any promises, follow-ups, or pending items mentioned
6. CONSIDER TIMING: Factor in urgency, seasonality, and life transitions

CONFIDENCE SCORING:
- 0.9-1.0: Explicitly stated facts
- 0.7-0.8: Strong inferences from context
- 0.5-0.6: Reasonable assumptions based on implications

RESPONSE FORMAT:
Return a JSON array of suggestion objects. Each object must follow this exact format:
{
  "field_path": "string", 
  "action": "add" | "update" | "remove",
  "suggested_value": "string, array (of strings or objects), or object. Structure must match the target field_path type.",
  "confidence": number (0.0 to 1.0),
  "reasoning": "string explaining why this update is suggested and the source in the memo"
}

EXAMPLES:

If memo says "My wife Sarah and I are moving to Boston next month because of my new job at TechCorp. Our son, Leo, is excited to start at his new school there.":
[
  {
    "field_path": "personal_context.family.partner",
    "action": "update", 
    "suggested_value": { "name": "Sarah", "relationship": "wife" },
    "confidence": 0.95,
    "reasoning": "Explicitly mentioned 'my wife Sarah' in the conversation."
  },
  {
    "field_path": "personal_context.family.children",
    "action": "add",
    "suggested_value": { "name": "Leo", "relationship": "son", "details": "Will be starting a new school in Boston." },
    "confidence": 0.9,
    "reasoning": "Mentioned 'Our son, Leo' and his upcoming school change."
  },
  {
    "field_path": "personal_context.key_life_events", 
    "action": "add",
    "suggested_value": "Moving to Boston for new job",
    "confidence": 0.9,
    "reasoning": "Major life transition mentioned - relocation for career."
  },
  {
    "field_path": "personal_context.upcoming_changes",
    "action": "add", 
    "suggested_value": "Relocation to Boston next month",
    "confidence": 0.9,
    "reasoning": "Specific upcoming change with timeline."
  },
  {
    "field_path": "company",
    "action": "update",
    "suggested_value": "TechCorp", 
    "confidence": 0.85,
    "reasoning": "Mentioned new job at TechCorp."
  },
  {
    "field_path": "professional_context.career_transitions",
    "action": "add",
    "suggested_value": "Job change to TechCorp",
    "confidence": 0.8,
    "reasoning": "Career transition implied by new job mention."
  }
]

If no relevant updates are found, return an empty array [].
Ensure the output is valid JSON.

CRITICAL: Your entire response must be ONLY the JSON array, starting with \`[\` and ending with \`]\`. Do NOT include any other text, explanations, or markdown formatting like triple backticks.

Example for removing from an array (less common, be specific): { "field_path": "professional_context.projects_involved", "action": "remove", "suggested_value": "Old Project X", "confidence": 0.7, "reasoning": "Memo states Old Project X has concluded." }
`;

  // Log the exact prompt being sent to OpenAI
  console.log("---- START OpenAI Prompt Content ----");
  console.log(promptContent);
  console.log("---- END OpenAI Prompt Content ----");

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-4o", // Changed to gpt-4o
        messages: [
          {
            role: "system",
            content: "You are an AI assistant that extracts relationship intelligence from voice memo transcriptions to suggest updates to a contact's profile. Follow the user's instructions precisely regarding format and field paths. Be conservative and only suggest updates explicitly mentioned or strongly implied."
          },
          {
            role: "user",
            content: promptContent
          }
        ],
        temperature: 0.2, // Lower temperature for more deterministic output
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`OpenAI API error: ${response.status} ${response.statusText}`, errorBody);
      throw new Error(`OpenAI API request failed with status ${response.status}: ${errorBody}`);
    }

    const result = await response.json();
    
    if (!result.choices || result.choices.length === 0 || !result.choices[0].message || !result.choices[0].message.content) {
      console.warn('OpenAI response missing expected content structure:', result);
      return null;
    }
    
    const content = result.choices[0].message.content;

    // Log the raw content string received from OpenAI
    console.log("---- START OpenAI Raw Response Content ----");
    console.log(content);
    console.log("---- END OpenAI Raw Response Content ----");

    // The AI is asked to return a JSON *array* directly.
    // If response_format: { type: "json_object" } is used, OpenAI wraps this in a JSON object.
    // e.g. { "suggestions": [...] } or similar. We need to adjust parsing accordingly or ensure the prompt asks for a direct array.
    // For now, assuming the content string IS the JSON array string.
    try {
      const parsedContent = JSON.parse(content);
      let suggestionsArray: any[] = [];
      if (Array.isArray(parsedContent)) {
        suggestionsArray = parsedContent;
        console.log('OpenAI returned a direct array of suggestions.');
      } else if (parsedContent && typeof parsedContent === 'object' && parsedContent !== null && Array.isArray(parsedContent.suggestions)) {
        suggestionsArray = parsedContent.suggestions;
        console.log('OpenAI returned suggestions wrapped in a {suggestions: []} object.');
      } else if (parsedContent && typeof parsedContent === 'object' && parsedContent !== null && 'field_path' in parsedContent) {
        // Handle case where OpenAI returns a single suggestion object directly due to response_format: {type: "json_object"} and only one suggestion
        console.log('OpenAI returned a single suggestion object directly. Wrapping in an array.');
        suggestionsArray = [parsedContent];
      } else {
        console.error('OpenAI content was not a direct array, not {suggestions: []}, nor a single suggestion object. Content:', JSON.stringify(parsedContent));
        // If not in an expected format, treat as no valid suggestions.
        // This will result in an empty array being returned, and the calling function will mark ai_parsing_status as 'completed'.
      }
      
      // Validate that each item in suggestionsArray has the required fields
      const validSuggestions = suggestionsArray.filter(s => 
        s && typeof s === 'object' &&
        typeof s.field_path === 'string' &&
        typeof s.action === 'string' && ['add', 'update', 'remove'].includes(s.action) &&
        s.hasOwnProperty('suggested_value') && // value can be null
        typeof s.confidence === 'number' &&
        typeof s.reasoning === 'string'
      );

      if (validSuggestions.length !== suggestionsArray.length) {
        console.warn('Some suggestions were filtered out due to missing required fields or invalid structure. Original count:', suggestionsArray.length, 'Valid count:', validSuggestions.length);
      }

      return validSuggestions;
    } catch (e) {
      console.error('Failed to parse OpenAI response content as JSON:', e, "Content was:", content);
      return null; // Return null on parsing error
    }
  } catch (error) {
    console.error('Error in parseWithOpenAI:', error);
    throw error; // Re-throw to be caught by the main handler
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
