'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react';
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
  } catch (error) {
    console.error('[Auth] Failed to load profile');
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const p = await fetchProfile(user.id);
    if (p) setProfile(p);
  }, [user]);

  useEffect(() => {
    let initialized = false;

    const markReady = () => {
      if (!initialized) {
        initialized = true;
        setIsLoading(false);
      }
    };

    // Safety timeout: if INITIAL_SESSION never fires (corrupt localStorage,
    // SDK bug, etc.), fall back to getSession() after 5 seconds.
    const safetyTimer = setTimeout(async () => {
      if (initialized) return; // Already handled by event
      const { data: { session: s } } = await supabase.auth.getSession();
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        const p = await fetchProfile(s.user.id);
        setProfile(p);
      }
      markReady();
    }, 5000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, s) => {
        setSession(s);
        setUser(s?.user ?? null);

        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
          if (s?.user) {
            const p = await fetchProfile(s.user.id);
            setProfile(p);
          }
          markReady();
        } else if (s?.user && event !== 'TOKEN_REFRESHED') {
          const p = await fetchProfile(s.user.id);
          if (p) setProfile(p);
        } else if (!s?.user) {
          setProfile(null);
          markReady();
        }
      }
    );

    // Proactive refresh when user returns from idle.
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        supabase.auth.getSession().then(({ data: { session: s } }) => {
          if (!s) return;
          const expiresAt = s.expires_at ?? 0;
          const now = Math.floor(Date.now() / 1000);
          if (expiresAt - now < 300) {
            supabase.auth.refreshSession();
          }
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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
