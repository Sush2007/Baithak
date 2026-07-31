"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {}
});

export const AuthProvider = ({ children }) => {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch the public profile record for the authenticated user
  const fetchProfile = async (userId) => {
    try {
      const fetchPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Profile fetch timeout")), 3000)
      );

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);

      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('JSON object requested, multiple (or no) rows returned')) {
          // Profile row does not exist yet. Returning fallback onboarding state.
          console.warn('Profile not found for authenticated user. Returning fallback onboarding state.');
          return { id: userId, setup_completed: false };
        }
        throw error;
      }
      return data;
    } catch (err) {
      console.error('Error fetching user profile:', err.message);
      if (err.message?.includes('JWT expired') || err.message?.includes('Auth session missing')) {
        console.warn('JWT expired, signing out forcefully...');
        supabase.auth.signOut();
      }
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      const updatedProfile = await fetchProfile(user.id);
      if (updatedProfile) {
        setProfile(updatedProfile);
      }
    }
  };

  useEffect(() => {
    let isMounted = true;
    console.log("[AuthContext] Mounting AuthProvider...");

    const initializeAuth = async () => {
      try {
        console.log("[AuthContext] Fetching initial session...");
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        
        console.log("[AuthContext] Session fetched:", session ? "User logged in" : "No user");

        if (isMounted) {
          setSession(session);
          setUser(session?.user || null);
        }

        if (session?.user) {
          const profileData = await fetchProfile(session.user.id);
          if (isMounted && profileData) setProfile(profileData);
        }
      } catch (error) {
        console.error("[AuthContext] Critical Auth Initialization Error:", error);
      } finally {
        console.log("[AuthContext] Auth initialization finished.");
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    let subscription = null;
    try {
      const result = supabase.auth.onAuthStateChange(async (event, currentSession) => {
        console.log("[AuthContext] Auth state changed:", event);
        if (!isMounted || event === 'INITIAL_SESSION') return; 

        setSession(currentSession);
        setUser(currentSession?.user || null);

        if (currentSession?.user) {
          const profileData = await fetchProfile(currentSession.user.id);
          if (isMounted && profileData) setProfile(profileData);
        } else {
          if (isMounted) setProfile(null);
        }
        if (isMounted) setLoading(false);
      });
      subscription = result.data.subscription;
    } catch (err) {
      console.error("[AuthContext] Failed to setup onAuthStateChange:", err);
    }

    return () => {
      console.log("[AuthContext] Unmounting AuthProvider...");
      isMounted = false;
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const redirectUrl = `${window.location.origin}/auth/callback`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });
      if (error) throw error;
    } catch (err) {
      console.error('Google sign-up/login failed:', err.message);
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      console.error('Logout failed:', err.message);
    } finally {
      setSession(null);
      setUser(null);
      setProfile(null);
      setLoading(false);
      router.refresh();
      router.replace('/');
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signInWithGoogle, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
