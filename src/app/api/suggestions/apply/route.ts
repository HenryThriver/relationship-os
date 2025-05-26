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
    // Ensure parent path exists and is an object. If it's an array, we might have an issue for object paths.
    // This logic assumes paths like 'arrayKey.objectProperty' are not expected, but rather 'objectKey.arrayKey'
    if (!current[key] || typeof current[key] !== 'object' || Array.isArray(current[key])) {
      current[key] = {}; // Initialize as object if not one
    }
    current = current[key];
  }
  const finalKey = keys[keys.length - 1];

  // Define field paths that are known to be arrays. 
  // This helps in deciding how to handle 'add', 'update', 'remove' actions.
  const arrayFieldPaths: Set<string> = new Set([
    // Personal Context Arrays
    'family.children',
    'key_life_events',
    'current_challenges',
    'upcoming_changes',
    'interests',
    'hobbies',
    'travel_plans',
    'values',
    'motivations',
    // Professional Context Arrays
    'key_responsibilities',
    'work_challenges',
    'goals',
    'skill_development',
    'career_transitions',
    'networking_objectives',
    'projects_involved',
    'collaborations',
    'upcoming_projects',
    'skills',
    'expertise_areas',
    'industry_knowledge',
    'mentions.colleagues',
    'mentions.clients',
    'mentions.competitors',
    'mentions.collaborators',
    'mentions.mentors',
    'mentions.industry_contacts',
    // Legacy array keys if still needed (review and remove if not)
    // 'education' // if education was treated as an array of strings/objects
  ]);

  const fullPathForArrayCheck = keys.join('.'); // Use the partial path relative to professional_context/personal_context
  const isArrayField = arrayFieldPaths.has(fullPathForArrayCheck);
  
  if (isArrayField) {
    let currentArray: any[] = Array.isArray(current[finalKey]) ? [...current[finalKey]] : [];

    if (action === 'add') {
      // If value is not an array, wrap it in an array for consistent processing
      const valuesToAdd = Array.isArray(value) ? value : (value !== null && value !== undefined ? [value] : []);
      // For arrays of objects, ensure no direct duplicates if an ID or unique key is present (not handled here, simple concat)
      // For arrays of primitives, use Set to avoid duplicates if desired, otherwise simple concat.
      // The prompt implies adding new items, so Set for primitives, direct add for objects (or more complex merge logic if needed)
      if (valuesToAdd.every(item => typeof item === 'object' && item !== null)) {
        current[finalKey] = [...currentArray, ...valuesToAdd]; // Add new objects
      } else {
        // For primitive arrays, avoid duplicates by converting to string temporarily for Set uniqueness
        const newSet = new Set([...currentArray.map(String), ...valuesToAdd.map(String)]);
        current[finalKey] = Array.from(newSet);
        // If original types need preservation (e.g. numbers), more care is needed than just String conversion
      }
    } else if (action === 'remove') {
      if (value === null || value === undefined) { // Implies clear the array
        current[finalKey] = [];
      } else {
        // For removing items, especially objects, comparison needs to be robust.
        // This basic filter might not work well for removing specific objects unless `value` is a primitive or an array of primitives.
        // If `value` is an object to remove, deep comparison or an ID would be needed.
        // For now, assumes `value` is an array of primitives to be removed.
        const valuesToRemove = Array.isArray(value) ? value.map(String) : [String(value)];
        current[finalKey] = currentArray.filter(item => !valuesToRemove.includes(String(item)));
      }
    } else { // 'update' for an array field means replacing the whole array with the new value(s)
      current[finalKey] = Array.isArray(value) ? value : (value !== null && value !== undefined ? [value] : []);
    }
  } else { // Field is not an array, simple set/delete
    if (action === 'remove') {
      delete current[finalKey];
    } else if (action === 'update' || action === 'add') { // 'add' on non-array is like 'update'
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