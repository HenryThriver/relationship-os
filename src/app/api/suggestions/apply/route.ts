import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { ContactUpdateSuggestion, UpdateSuggestionRecord } from '@/types/suggestions';
import { Database, Json } from '@/lib/supabase/database.types'; // Assuming this is your main generated types

// Helper type for context fields
type ContactContext = { [key: string]: Json | undefined };

export async function POST(request: NextRequest) {
  try {
    const { suggestionId, selectedPaths } = await request.json();
    
    if (!suggestionId || !Array.isArray(selectedPaths)) {
      return NextResponse.json({ error: 'Missing suggestionId or selectedPaths' }, { status: 400 });
    }

    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    const { data: suggestionRecord, error: fetchError } = await supabase
      .from('contact_update_suggestions')
      .select(`
        *,
        contacts (*)
      `)
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

    const contact = suggestionRecord.contacts;
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

    const contactUpdates: Partial<Database['public']['Tables']['contacts']['Row']> = {};
    const sourceUpdates: Record<string, string> = { ...(contact.field_sources as object || {}) };

    for (const s of selectedSuggestions) {
      sourceUpdates[s.field_path] = suggestionRecord.artifact_id;
      
      if (s.field_path.startsWith('professional_context.')) {
        const field = s.field_path.replace('professional_context.', '');
        // Ensure currentProfessionalContext is an object
        const currentProfessionalContext: ContactContext = typeof contact.professional_context === 'object' && contact.professional_context !== null && !Array.isArray(contact.professional_context)
          ? contact.professional_context as ContactContext
          : {};
        let updatedProfessionalContext = { ...currentProfessionalContext };

        const arrayFields = ['goals', 'key_responsibilities', 'projects_involved', 'skills', 'challenges'];

        if (s.action === 'add' && arrayFields.includes(field)) {
          const currentArray = (updatedProfessionalContext[field] as string[] || []);
          const valuesToAdd = Array.isArray(s.suggested_value) ? s.suggested_value : [s.suggested_value];
          updatedProfessionalContext[field] = Array.from(new Set([...currentArray, ...valuesToAdd.map(String)]));
        } else if (s.action === 'update') {
          updatedProfessionalContext[field] = s.suggested_value as Json;
        } else if (s.action === 'remove') {
          if (arrayFields.includes(field)) {
            const currentArray = (updatedProfessionalContext[field] as string[] || []);
            if (s.suggested_value === null || s.suggested_value === undefined) {
                 delete updatedProfessionalContext[field];
            } else {
                updatedProfessionalContext[field] = currentArray.filter(item => item !== s.suggested_value);
            }
          } else { 
             delete updatedProfessionalContext[field];
          }
        }
        contactUpdates.professional_context = updatedProfessionalContext as Json;

      } else if (s.field_path.startsWith('personal_context.')) {
        const field = s.field_path.replace('personal_context.', '');
        const currentPersonalContext: ContactContext = typeof contact.personal_context === 'object' && contact.personal_context !== null && !Array.isArray(contact.personal_context)
            ? contact.personal_context as ContactContext
            : {};
        let updatedPersonalContext = { ...currentPersonalContext };
        
        const arrayFields = ['interests', 'children_names', 'key_life_events', 'hobbies', 'education'];

        if (s.action === 'add' && arrayFields.includes(field)) {
          const currentArray = (updatedPersonalContext[field] as string[] || []);
          const valuesToAdd = Array.isArray(s.suggested_value) ? s.suggested_value : [s.suggested_value];
          updatedPersonalContext[field] = Array.from(new Set([...currentArray, ...valuesToAdd.map(String)]));
        } else if (s.action === 'update') {
          updatedPersonalContext[field] = s.suggested_value as Json;
        } else if (s.action === 'remove') {
           if (arrayFields.includes(field)) {
            const currentArray = (updatedPersonalContext[field] as string[] || []);
            if (s.suggested_value === null || s.suggested_value === undefined) {
                 delete updatedPersonalContext[field];
            } else {
                updatedPersonalContext[field] = currentArray.filter(item => item !== s.suggested_value);
            }
          } else {
             delete updatedPersonalContext[field];
          }
        }
        contactUpdates.personal_context = updatedPersonalContext as Json;
      } else {
        // Direct field updates like 'company' or 'title'
        const directFieldKey = s.field_path as keyof Pick<Database['public']['Tables']['contacts']['Row'], 'company' | 'title'>; // Add other direct fields if any
        if (s.action === 'remove') {
            contactUpdates[directFieldKey] = null;
        } else {
            contactUpdates[directFieldKey] = s.suggested_value as any; // Cast to any if type is complex
        }
      }
    }

    contactUpdates.field_sources = sourceUpdates as Json;

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