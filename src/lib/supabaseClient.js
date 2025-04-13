import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Debug Supabase connection parameters
console.log('Initializing Supabase client with:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? `${supabaseUrl.substring(0, 8)}...` : 'Missing');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set (hidden for security)' : 'Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase environment variables. Please check your .env file.' + 
    '\nNEXT_PUBLIC_SUPABASE_URL: ' + (supabaseUrl ? 'Set' : 'Missing') +
    '\nNEXT_PUBLIC_SUPABASE_ANON_KEY: ' + (supabaseAnonKey ? 'Set' : 'Missing')
  );
}

export const supabase = createClient(
  supabaseUrl || '', 
  supabaseAnonKey || '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      fetch: (...args) => fetch(...args),
    },
  }
);

// Log successful initialization
console.log('Supabase client initialized');