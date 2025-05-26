import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ContactUpdateSuggestion, UpdateSuggestionRecord } from '@/types/suggestions';
import { Database, Json } from '@/lib/supabase/database.types'; // Assuming this is your main generated types

// Helper type for context fields
type ContactContext = { [key: string]: any }; // Using any for easier deep manipulation

// Helper function to set a value at a nested path
function setValueAtPath(obj: ContactContext, path: string, value: any, action: 'add' | 'update' | 'remove') {
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  const finalKey = keys[keys.length - 1];

  // Simplified map for array fields based on the final key in the path
  const arrayFieldFinalKeys: Record<string, boolean> = {
    'goals': true, 'key_responsibilities': true, 'projects_involved': true, 'skills': true, 'challenges': true,
    'interests': true, 'key_life_events': true, 'hobbies': true, 'education': true,
    'children_names': true 
  };

  const isArrayField = arrayFieldFinalKeys[finalKey] === true;
  
  if (isArrayField) {
    let currentArray: any[] = Array.isArray(current[finalKey]) ? current[finalKey] : [];
    const valuesToProcess = Array.isArray(value) ? value.map(String) : (value !== null && value !== undefined ? [String(value)] : []);

    if (action === 'add') {
      current[finalKey] = Array.from(new Set([...currentArray, ...valuesToProcess]));
    } else if (action === 'remove') {
      if (value === null || value === undefined) { // If value is null/undefined, implies clear the array or remove a specific null/undefined if it existed (latter is rare)
        current[finalKey] = []; // Clearing the array for explicit null/undefined removal value
      } else {
        current[finalKey] = currentArray.filter(item => !valuesToProcess.includes(String(item)));
      }
    } else { // 'update' for an array field means replacing the whole array
      current[finalKey] = valuesToProcess;
    }
  } else {
    if (action === 'remove') {
      delete current[finalKey];
    } else if (action === 'update' || action === 'add') {
      current[finalKey] = value;
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { suggestionId, selectedPaths } = body;
    
    if (!suggestionId || !Array.isArray(selectedPaths) || selectedPaths.some(p => typeof p !== 'string')) {
      return NextResponse.json({ error: 'Missing or invalid suggestionId or selectedPaths' }, { status: 400 });
    }

    const supabase = await createClient();
    
    const { data: suggestionRecord, error: fetchError } = await supabase
      .from('contact_update_suggestions')
      .select(
        `*,
        contacts (*)`
      )
      .eq('id', suggestionId)
      .single<UpdateSuggestionRecord & { contacts: Database['public']['Tables']['contacts']['Row'] | null }>();

    if (fetchError || !suggestionRecord) {
      console.error('Error fetching suggestion record:', fetchError);
      return NextResponse.json({ error: 'Suggestion not found or database error' }, { status: 404 });
    }
    if (!suggestionRecord.contacts) {
      console.error('Contact data missing from suggestion record:', suggestionRecord);
      return NextResponse.json({ error: 'Associated contact not found' }, { status: 404 });
    }

    // Deep clone contact to avoid modifying the cached record directly if not intended
    const contact = JSON.parse(JSON.stringify(suggestionRecord.contacts));
    console.log('[ApplySuggestions API] Initial contact data (cloned):', JSON.stringify(contact, null, 2));
    
    const allSuggestions: ContactUpdateSuggestion[] = suggestionRecord.suggested_updates.suggestions;
    const selectedSuggestions = allSuggestions.filter(s => selectedPaths.includes(s.field_path));

    if (selectedSuggestions.length === 0) {
      await supabase
        .from('contact_update_suggestions')
        .update({
          status: 'rejected',
          user_selections: {},
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', suggestionId);
      return NextResponse.json({ success: true, message: 'No updates selected. Suggestion marked as reviewed.' });
    }
    
    // Ensure context fields are objects
    contact.professional_context = (typeof contact.professional_context === 'object' && contact.professional_context !== null && !Array.isArray(contact.professional_context)) ? contact.professional_context : {};
    contact.personal_context = (typeof contact.personal_context === 'object' && contact.personal_context !== null && !Array.isArray(contact.personal_context)) ? contact.personal_context : {};
    console.log('[ApplySuggestions API] Contexts after initialization:', JSON.stringify({ prof: contact.professional_context, pers: contact.personal_context }, null, 2));

    const contactUpdates: Partial<Database['public']['Tables']['contacts']['Row']> = {};
    const sourceUpdates: Record<string, string> = { ...(contact.field_sources as object || {}) };

    for (const s of selectedSuggestions) {
      sourceUpdates[s.field_path] = suggestionRecord.artifact_id;
      const action = s.action as 'add' | 'update' | 'remove';
      console.log(`[ApplySuggestions API] Processing suggestion for path: ${s.field_path}, action: ${action}, value: ${JSON.stringify(s.suggested_value)}`);

      if (s.field_path.startsWith('professional_context.')) {
        const path = s.field_path.replace('professional_context.', '');
        const profContextBefore = JSON.stringify(contact.professional_context);
        setValueAtPath(contact.professional_context as ContactContext, path, s.suggested_value, action);
        // Ensure a fresh clone is assigned to contactUpdates
        contactUpdates.professional_context = JSON.parse(JSON.stringify(contact.professional_context)) as Json; 
        console.log(`[ApplySuggestions API] Prof. context BEFORE: ${profContextBefore}, AFTER setValueAtPath: ${JSON.stringify(contact.professional_context)}`);
      } else if (s.field_path.startsWith('personal_context.')) {
        const path = s.field_path.replace('personal_context.', '');
        const persContextBefore = JSON.stringify(contact.personal_context);
        setValueAtPath(contact.personal_context as ContactContext, path, s.suggested_value, action);
        // Ensure a fresh clone is assigned to contactUpdates
        contactUpdates.personal_context = JSON.parse(JSON.stringify(contact.personal_context)) as Json;
        console.log(`[ApplySuggestions API] Pers. context BEFORE: ${persContextBefore}, AFTER setValueAtPath: ${JSON.stringify(contact.personal_context)}`);
      } else {
        const directFieldKey = s.field_path as keyof Pick<Database['public']['Tables']['contacts']['Row'], 'company' | 'title'>;
        if (action === 'remove') {
            (contactUpdates as any)[directFieldKey] = null;
        } else {
            (contactUpdates as any)[directFieldKey] = s.suggested_value;
        }
      }
    }

    contactUpdates.field_sources = sourceUpdates as Json;
    console.log('[ApplySuggestions API] Final contactUpdates payload:', JSON.stringify(contactUpdates, null, 2));

    const { error: updateContactError } = await supabase
      .from('contacts')
      .update(contactUpdates)
      .eq('id', contact.id);

    if (updateContactError) {
      console.error('Error updating contact:', updateContactError);
      return NextResponse.json({ error: `Failed to update contact information: ${updateContactError.message}` }, { status: 500 });
    }

    const finalSuggestionStatus = selectedPaths.length === allSuggestions.length ? 'approved' : 'partial';
    const userSelections = Object.fromEntries(allSuggestions.map(s => 
      [s.field_path, selectedPaths.includes(s.field_path)]
    ));

    await supabase
      .from('contact_update_suggestions')
      .update({
        status: finalSuggestionStatus,
        user_selections: userSelections,
        reviewed_at: new Date().toISOString(),
        applied_at: new Date().toISOString()
      })
      .eq('id', suggestionId);

    return NextResponse.json({ success: true, message: 'Updates applied successfully.' });

  } catch (error: any) {
    console.error('Apply suggestions API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to apply suggestions' }, 
      { status: 500 }
    );
  }
} 