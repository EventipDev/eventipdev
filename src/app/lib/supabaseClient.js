import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a single supabase client instance - safely
let supabase = null;

// Initialize the client only if we have the required configuration
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: typeof window !== 'undefined' // Only persist sessions on the client
    }
  });
}

export const getSupabaseClient = () => {
  if (!supabase) {
    console.error('Supabase client not initialized. Check your environment variables.');
  }
  return supabase;
};

export { supabase }; 