'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { getProfile } from '@/lib/supabase-data';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile } from '@/types';

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchProfile(userId: string): Promise<Profile | null> {
  try {
    return await getProfile(userId);
  } catch {
    console.error('[Auth] Failed to load profile');
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initializedRef = useRef(false);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const p = await fetchProfile(user.id);
    if (p) setProfile(p);
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    // Hard failsafe: force isLoading=false after 8s no matter what.
    // Prevents infinite spinner even if Supabase is completely down.
    const failsafe = setTimeout(() => {
      if (!cancelled && !initializedRef.current) {
        console.warn('[Auth] Failsafe timeout — forcing auth load complete');
        initializedRef.current = true;
        setIsLoading(false);
      }
    }, 8000);

    // Use onAuthStateChange as the primary source of truth.
    // Supabase SDK fires INITIAL_SESSION synchronously after subscribing
    // if it has a cached session in localStorage — this is the fastest path.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, s) => {
        if (cancelled) return;

        setSession(s);
        setUser(s?.user ?? null);

        if (event === 'INITIAL_SESSION') {
          // First event — mark initialization done
          if (s?.user) {
            const p = await fetchProfile(s.user.id);
            if (!cancelled) setProfile(p);
          }
          if (!cancelled) {
            initializedRef.current = true;
            setIsLoading(false);
          }
        } else if (event === 'SIGNED_IN') {
          const p = s?.user ? await fetchProfile(s.user.id) : null;
          if (!cancelled) setProfile(p);
        } else if (event === 'SIGNED_OUT') {
          if (!cancelled) setProfile(null);
        }
        // TOKEN_REFRESHED — session/user already updated, skip profile refetch
      }
    );

    return () => {
      cancelled = true;
      clearTimeout(failsafe);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const isAdmin = profile?.role === 'admin';
  const isEditor = profile?.role === 'admin' || profile?.role === 'editor';

  const value = useMemo(() => ({
    user,
    profile,
    session,
    isLoading,
    isAdmin,
    isEditor,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  }), [user, profile, session, isLoading, isAdmin, isEditor, signIn, signUp, signOut, refreshProfile]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
