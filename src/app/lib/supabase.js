import { createClient } from '@supabase/supabase-js';

// Create a single supabase client for interacting with your database
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    db: {
      schema: 'public'
    },
    // Set global headers to bypass RLS
    global: {
      headers: {
        // This bypasses RLS if you have configured your supabase to do so
        'X-Client-Info': 'event-manager-app'
      }
    }
  }
);

// Only access localStorage in browser environment
if (typeof window !== 'undefined') {
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      console.log('User data found in localStorage');
    } else {
      console.log('No user data found in localStorage');
    }
  } catch (error) {
    console.error('Error checking localStorage for user data:', error);
  }
}

export default supabase; 