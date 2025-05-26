import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log('read_contact_context function starting...');

serve(async (req) => {
  try {
    const { contactId } = await req.json();
    console.log('Received contactId:', contactId);

    if (!contactId) {
      return new Response(JSON.stringify({ error: 'contactId is required' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Create a Supabase client with the Auth context of the user that called the function.
    // This way your row-level-security (RLS) policies are applied.
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    console.log('Supabase client created.');

    const { data, error } = await supabaseClient
      .from('contacts')
      .select('personal_context, professional_context')
      .eq('id', contactId)
      .single();

    if (error) {
      console.error('Error fetching contact context:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (!data) {
      return new Response(JSON.stringify({ error: 'Contact not found' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 404,
      });
    }
    
    console.log('Successfully fetched data:', data);
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 200,
    });
  } catch (e) {
    console.error('Unhandled error in function:', e);
    return new Response(JSON.stringify({ error: e.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}); 