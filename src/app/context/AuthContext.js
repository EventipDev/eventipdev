'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '../lib/supabase';

// Create the authentication context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Auth provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Only access localStorage in browser environment
    let storedUser = null;
    if (typeof window !== 'undefined') {
      // Check for user in localStorage first (faster than waiting for Supabase)
      const storedUserStr = localStorage.getItem('user');
      if (storedUserStr) {
        try {
          storedUser = JSON.parse(storedUserStr);
          setUser(storedUser);
        } catch (e) {
          console.error('Error parsing stored user:', e);
        }
      }
    }

    // Then check Supabase session
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (!error && data && data.session) {
          // We have a session, get the user
          const { data: userData, error: userError } = await supabase.auth.getUser();
          
          if (!userError && userData && userData.user) {
            setUser(userData.user);
            
            // Update localStorage with latest user data if needed
            if (typeof window !== 'undefined' && !storedUser) {
              // Try to get profile data
              try {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', userData.user.id)
                  .single();
                  
                if (profile) {
                  localStorage.setItem('user', JSON.stringify({
                    id: userData.user.id,
                    email: userData.user.email,
                    first_name: profile.first_name || userData.user.user_metadata?.first_name || '',
                    last_name: profile.last_name || userData.user.user_metadata?.last_name || '',
                    phone_number: profile.phone_number || userData.user.user_metadata?.phone_number || ''
                  }));
                } else {
                  // No profile, use metadata
                  localStorage.setItem('user', JSON.stringify({
                    id: userData.user.id,
                    email: userData.user.email,
                    first_name: userData.user.user_metadata?.first_name || '',
                    last_name: userData.user.user_metadata?.last_name || '',
                    phone_number: userData.user.user_metadata?.phone_number || ''
                  }));
                }
              } catch (e) {
                console.error('Error getting profile:', e);
              }
            }
          }
        }
      } catch (e) {
        console.error('Error checking session:', e);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          setUser(session.user);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Sign out function
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
      }
      setUser(null);
      router.push('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const updateUserMetadata = async (metadata) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: metadata
      });

      if (error) throw error;

      // Update local user state
      if (data && data.user) {
        setUser(data.user);
        
        // Update localStorage
        if (typeof window !== 'undefined') {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              const updatedUser = { ...parsedUser, ...metadata };
              localStorage.setItem('user', JSON.stringify(updatedUser));
            } catch (e) {
              console.error('Error updating stored user:', e);
            }
          }
        }
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error updating user metadata:', error);
      return { data: null, error };
    }
  };

  // Value to be provided by the context
  const value = {
    user,
    loading,
    signOut,
    updateUserMetadata,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
} 