// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log("Hello from Functions!")

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { record } = await req.json() // Assuming the trigger sends the artifact record
    
    // Validate incoming record
    if (!record || !record.id || !record.contact_id || !record.type) {
      console.error('Invalid record structure received:', record);
      return new Response(JSON.stringify({ error: 'Invalid record structure' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Only process voice memos with completed transcriptions and pending AI parsing
    if (
      record.type !== 'voice_memo' || 
      !record.transcription || 
      record.transcription_status !== 'completed' ||
      record.ai_parsing_status !== 'pending' // Check if parsing is pending
    ) {
      // Log why it's skipped, but return 200 as it's not an error, just not ready
      console.log(`Skipping parsing for artifact ${record.id}: Type: ${record.type}, Transcription Status: ${record.transcription_status}, AI Parsing Status: ${record.ai_parsing_status}`);
      return new Response(JSON.stringify({ message: 'Artifact not ready for parsing or already processed/skipped.' }), { 
        status: 200, // Not an error, just not actionable currently
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!, // Ensure this secret is named SUPABASE_URL
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Update parsing status to 'processing'
    const { error: updateToProcessingError } = await supabase
      .from('artifacts')
      .update({ ai_parsing_status: 'processing' })
      .eq('id', record.id);

    if (updateToProcessingError) {
      console.error(`Error updating artifact ${record.id} to processing:`, updateToProcessingError);
      throw new Error(`Failed to update artifact status to processing: ${updateToProcessingError.message}`);
    }

    // Get contact data
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*') // Select all fields for context, or specify if only certain fields are needed
      .eq('id', record.contact_id)
      .single();

    if (contactError || !contact) {
      console.error(`Contact not found for ID ${record.contact_id}:`, contactError);
      // Update artifact status to 'failed' if contact not found
      await supabase.from('artifacts').update({ ai_parsing_status: 'failed' }).eq('id', record.id);
      throw new Error(contactError ? `Contact fetch error: ${contactError.message}` : 'Contact not found');
    }
    
    console.log(`Processing artifact ${record.id} for contact ${contact.id}`);

    // Call OpenAI for parsing
    const suggestions = await parseWithOpenAI(record.transcription, contact);

    if (suggestions.length === 0) {
      // If no suggestions, mark as completed (or skipped if that's more appropriate)
      await supabase
        .from('artifacts')
        .update({ ai_parsing_status: 'completed' }) // or 'skipped' if no suggestions means nothing to do
        .eq('id', record.id);
      
      console.log(`No suggestions found for artifact ${record.id}. Marked as completed.`);
      return new Response(JSON.stringify({ success: true, message: 'No suggestions generated.', suggestions_count: 0 }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Store suggestions
    // Note: user_id for the suggestion should be the owner of the contact/artifact
    const { error: insertSuggestionsError } = await supabase
      .from('contact_update_suggestions')
      .insert({
        artifact_id: record.id,
        contact_id: record.contact_id,
        user_id: contact.user_id, // Assuming contact has a user_id field
        suggested_updates: { suggestions }, // Ensure this structure matches your table (JSONB column)
        field_paths: suggestions.map(s => s.field_path),
        // confidence_scores might need to be a JSON object if your table expects that
        confidence_scores: Object.fromEntries(suggestions.map(s => [s.field_path, s.confidence]))
      });

    if (insertSuggestionsError) {
      console.error(`Error inserting suggestions for artifact ${record.id}:`, insertSuggestionsError);
      await supabase.from('artifacts').update({ ai_parsing_status: 'failed' }).eq('id', record.id);
      throw new Error(`Failed to store suggestions: ${insertSuggestionsError.message}`);
    }
    
    console.log(`${suggestions.length} suggestions stored for artifact ${record.id}.`);

    // Update artifact status to 'completed'
    const { error: updateToCompletedError } = await supabase
      .from('artifacts')
      .update({ ai_parsing_status: 'completed' })
      .eq('id', record.id);

    if (updateToCompletedError) {
      // Log this error but proceed as suggestions were stored. This is less critical.
      console.error(`Error updating artifact ${record.id} to completed status after storing suggestions:`, updateToCompletedError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `${suggestions.length} suggestions stored.`,
      suggestions_count: suggestions.length 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('General parsing error in Edge Function:', error);
    // Attempt to update artifact status to 'failed' if an ID is available in the error or context
    // This part needs careful handling to ensure 'record.id' is accessible here or passed through error
    // For simplicity, assuming 'record' might not be in scope or reliable in a generic catch
    return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred' }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})

async function parseWithOpenAI(transcription: string, contact: any): Promise<Array<{field_path: string; action: 'add' | 'update' | 'remove'; suggested_value: any; confidence: number; reasoning: string}>> {
  // Ensure OPENAI_API_KEY is available
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    console.error('OPENAI_API_KEY is not set in environment variables.');
    throw new Error('OpenAI API key is missing.');
  }

  const promptContent = `
Contact Name: ${contact.name || 'Unknown'}
Contact Company: ${contact.company || 'Unknown'}
Contact Title: ${contact.title || 'Unknown'}

Current Professional Context (JSON): 
${JSON.stringify(contact.professional_context || {}, null, 2)}

Current Personal Context (JSON): 
${JSON.stringify(contact.personal_context || {}, null, 2)}

Voice Memo Transcription: 
"${transcription}"

Instructions:
Analyze the voice memo transcription in the context of the contact's current information.
Suggest specific updates (add, update, or remove) for the contact's profile fields.
Only suggest updates for information that is *explicitly mentioned or strongly implied* in the voice memo. Be conservative with suggestions.
If a piece of information is already present and correct in the current context, do not suggest an update for it.
If the memo mentions something that contradicts existing information, suggest an 'update'.
If the memo mentions new information relevant to a field, suggest 'add'.
If the memo explicitly states something should be removed or is no longer true, suggest 'remove'.

Valid field_path targets are:
- "company" (string)
- "title" (string)
- "professional_context.current_role_description" (string)
- "professional_context.key_responsibilities" (array of strings, suggest 'add' for new items)
- "professional_context.projects_involved" (array of strings, suggest 'add' for new items)
- "professional_context.skills" (array of strings, suggest 'add' for new items)
- "professional_context.goals" (array of strings, suggest 'add' for new items)
- "professional_context.challenges" (array of strings, suggest 'add' for new items)
- "professional_context.mentions.[category]" (e.g., "professional_context.mentions.competitors", "professional_context.mentions.collaborators"; value is an array of strings, suggest 'add' for new items)
- "personal_context.interests" (array of strings, suggest 'add' for new items)
- "personal_context.family_details.partner_name" (string)
- "personal_context.family_details.children_names" (array of strings, suggest 'add' for new items)
- "personal_context.key_life_events" (array of strings, suggest 'add' for new items)
- "personal_context.hobbies" (array of strings, suggest 'add' for new items)
- "personal_context.education" (array of strings, suggest 'add' for new items)

Return a JSON array of suggestion objects. Each object must follow this exact format:
{
  "field_path": "string", 
  "action": "add" | "update" | "remove",
  "suggested_value": "string or array of strings, depending on the field_path. For 'remove', this can be the value to remove or null if removing the entire field if appropriate.",
  "confidence": number (0.0 to 1.0, representing your certainty),
  "reasoning": "string (briefly explain why this update is suggested based on the memo)"
}

If no relevant updates are found, return an empty array [].
Ensure the output is a valid JSON array.
Example for adding to an array: { "field_path": "personal_context.interests", "action": "add", "suggested_value": "Skiing", "confidence": 0.9, "reasoning": "Memo mentions a recent ski trip." }
Example for updating a string: { "field_path": "title", "action": "update", "suggested_value": "Senior Manager", "confidence": 0.8, "reasoning": "Contact mentioned they were promoted to Senior Manager." }
Example for removing from an array (less common, be specific): { "field_path": "professional_context.projects_involved", "action": "remove", "suggested_value": "Old Project X", "confidence": 0.7, "reasoning": "Memo states Old Project X has concluded." }
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-4-turbo", // Using a more recent model, or gpt-4
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
        response_format: { type: "json_object" } // Request JSON output if model supports
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
      return [];
    }
    
    const content = result.choices[0].message.content;

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
      return []; // Return empty array on parsing error
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
