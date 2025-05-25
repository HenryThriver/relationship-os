import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/supabase/types_db';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}
if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

export const supabase = createBrowserClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);

// The following functions might be useful later, but for now, 
// let's keep the client simple with just the main export.
// We can uncomment or add them back if needed.

/*
// Client-side supabase client for use in components
export const createClientComponentClient = () => {
  return createBrowserClient<Database>(
    supabaseUrl!,
    supabaseAnonKey!
  );
};

// Server-side supabase client for use in server components and API routes
export const createServerComponentClient = () => {
  // This would typically use createServerClient from '@supabase/ssr'
  // and handle cookies if you were using server-side auth helpers.
  // For a simple client without server-side auth helpers:
  return createBrowserClient<Database>( // Or a different client creation if needed
    supabaseUrl!,
    supabaseAnonKey!
  );
};
*/ 