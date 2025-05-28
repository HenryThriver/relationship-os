import { createClient } from '@supabase/supabase-js';
import { Database } from './src/lib/supabase/types_db'; // Using relative path from root

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL or anon key is not defined. Check your .env.local file.");
}

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// This should work if types are correct:
const test = supabase.from('loop_analytics').select('*');
const test2 = supabase.from('loop_templates').select('*');
const test3 = supabase.from('artifacts').select('*'); // Control test with a known working table

console.log('Test queries created. Check for linter errors in this file.'); 