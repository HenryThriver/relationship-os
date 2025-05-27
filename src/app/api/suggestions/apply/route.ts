import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ContactUpdateSuggestion, UpdateSuggestionRecord } from '@/types/suggestions';
import { Database, Json } from '@/lib/supabase/database.types'; // Assuming this is your main generated types

// Helper type for context fields
type ContactContext = { [key: string]: unknown }; // Changed any to unknown

// Define arrayFieldPaths at the module level so it can be accessed by the POST handler
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
]);

// Helper function to set a value at a nested path
function setValueAtPath(obj: ContactContext, path: string, value: unknown, action: 'add' | 'update' | 'remove') {
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    // Ensure parent path exists and is an object. If it's an array, we might have an issue for object paths.
    // This logic assumes paths like 'arrayKey.objectProperty' are not expected, but rather 'objectKey.arrayKey'
    if (!current[key] || typeof current[key] !== 'object' || Array.isArray(current[key])) {
      current[key] = {}; // Initialize as object if not one
    }
    current = current[key] as ContactContext;
  }
  const finalKey = keys[keys.length - 1];

  const fullPathForArrayCheck = keys.join('.'); // Use the partial path relative to professional_context/personal_context
  const isArrayField = arrayFieldPaths.has(fullPathForArrayCheck);
  
  if (isArrayField) {
    const currentArray: unknown[] = Array.isArray(current[finalKey]) ? [...current[finalKey] as unknown[]] : [];

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
      // const action = s.action as 'add' | 'update' | 'remove'; // Keep this for logging if needed
      console.log(`[ApplySuggestions API] Processing suggestion for path: ${s.field_path}, action: ${s.action}, value: ${JSON.stringify(s.suggested_value)}`);

      const artifactId = suggestionRecord.artifact_id;
      const fullSuggestedPath = s.field_path; // e.g., "personal_context.key_life_events"

      // Apply actual data updates using setValueAtPath
      let contextObjectToUpdate: ContactContext | undefined;
      let pathWithinContext: string | undefined; // path relative to personal_context or professional_context
      let mainContextKey: 'personal_context' | 'professional_context' | undefined;

      if (fullSuggestedPath.startsWith('professional_context.')) {
        pathWithinContext = fullSuggestedPath.replace('professional_context.', '');
        mainContextKey = 'professional_context';
        contextObjectToUpdate = contact.professional_context as ContactContext;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setValueAtPath(contextObjectToUpdate, pathWithinContext, s.suggested_value, s.action as any);
        contactUpdates.professional_context = JSON.parse(JSON.stringify(contact.professional_context)) as Json;
      } else if (fullSuggestedPath.startsWith('personal_context.')) {
        pathWithinContext = fullSuggestedPath.replace('personal_context.', '');
        mainContextKey = 'personal_context';
        contextObjectToUpdate = contact.personal_context as ContactContext;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setValueAtPath(contextObjectToUpdate, pathWithinContext, s.suggested_value, s.action as any);
        contactUpdates.personal_context = JSON.parse(JSON.stringify(contact.personal_context)) as Json;
      } else {
        // Direct contact field update (e.g., 'company', 'title')
        const directFieldKey = fullSuggestedPath as keyof Database['public']['Tables']['contacts']['Row'];
        if (s.action === 'remove') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (contactUpdates as any)[directFieldKey] = null;
        } else { // 'add' or 'update'
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (contactUpdates as any)[directFieldKey] = s.suggested_value;
        }
        // Source the direct field - already granular
        sourceUpdates[fullSuggestedPath] = artifactId;
      }

      // Granular source attribution logic
      if (mainContextKey && pathWithinContext) {
        const isArrayFieldTarget = arrayFieldPaths.has(pathWithinContext);

        if (s.action === 'update') {
          if (isArrayFieldTarget) {
            // AI suggested an 'update' to an entire array. Treat as replacing the array.
            // Source each element of the new array value.
            const newArrayValue = Array.isArray(s.suggested_value) ? s.suggested_value : (s.suggested_value !== null && s.suggested_value !== undefined ? [s.suggested_value] : []);
            newArrayValue.forEach((_, index) => {
              sourceUpdates[`${fullSuggestedPath}.${index}`] = artifactId;
            });
          } else if (typeof s.suggested_value === 'object' && s.suggested_value !== null && !Array.isArray(s.suggested_value)) {
            // AI suggested an 'update' to an object. Source each key within the suggested_value.
            for (const key in s.suggested_value) {
              if (Object.prototype.hasOwnProperty.call(s.suggested_value, key)) {
                sourceUpdates[`${fullSuggestedPath}.${key}`] = artifactId;
              }
            }
          } else {
            // Simple field update within context (e.g. professional_context.pending_requests)
            sourceUpdates[fullSuggestedPath] = artifactId;
          }
        } else if (s.action === 'add' && isArrayFieldTarget) {
          // AI suggested an 'add' to an array.
          // After setValueAtPath, get the current state of that array from the (potentially) modified contact object.
          let finalArrayState: unknown[] = [];
          let tempCurrent = contact[mainContextKey] as ContactContext; // Start with the correct context object
          const keysToTargetArray = pathWithinContext.split('.');
          try {
            for (let i = 0; i < keysToTargetArray.length; i++) {
              tempCurrent = tempCurrent[keysToTargetArray[i]] as ContactContext;
            }
            if(Array.isArray(tempCurrent)) {
              finalArrayState = tempCurrent;
            }
          } catch (e) { // eslint-disable-line @typescript-eslint/no-unused-vars
            console.warn(`[ApplySuggestions API] Could not resolve path to array for sourcing: ${pathWithinContext} in ${mainContextKey}`);
            finalArrayState = []; // Fallback to empty if path resolution fails
          }
          
          // Source each element of the array's current state.
          // If the element is an object, source its properties.
          finalArrayState.forEach((item, index) => {
            const currentItemBasePath = `${fullSuggestedPath}.${index}`; // e.g., "personal_context.family.children.0"
            if (typeof item === 'object' && item !== null) {
              // It's an object within the array, source its properties
              for (const key in item) {
                if (Object.prototype.hasOwnProperty.call(item, key)) {
                  sourceUpdates[`${currentItemBasePath}.${key}`] = artifactId; // e.g., "personal_context.family.children.0.name"
                }
              }
            } else {
              // It's a primitive value in the array (e.g., for key_life_events)
              sourceUpdates[currentItemBasePath] = artifactId; // e.g., "personal_context.key_life_events.0"
            }
          });
        } else if (s.action === 'remove') {
          // For 'remove', the original coarse path is removed from sourceUpdates.
          // If it was an object, its sub-properties sourced previously would remain unless explicitly cleared.
          // If it was an array element, specific index sourcing for removal is very complex.
          // Safest for now: remove the coarse path source. UI won't show source for removed data.
          // If specific object properties were removed, their source entries won't be automatically cleaned up by this logic.
          delete sourceUpdates[fullSuggestedPath];
          // Potentially, if s.suggested_value indicates what was removed, could try to remove specific granular paths.
          // For example, if action: 'remove', field_path: 'personal_context.interests', value: 'OldInterest',
          // we'd need to find index of 'OldInterest' and delete personal_context.interests.INDEX
        } else {
           // Default for other actions or non-array/non-object 'add'/'update' on context fields
           sourceUpdates[fullSuggestedPath] = artifactId;
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

    return NextResponse.json({ success: true, message: 'Updates applied and suggestion marked as reviewed.' });

  } catch (error: unknown) {
    console.error('Error applying suggestions:', error);
    const message = error instanceof Error ? error.message : 'An unexpected server error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 