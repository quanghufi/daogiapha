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

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const p = await fetchProfile(user.id);
    if (p) setProfile(p);
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        // getSession() may call network if token needs refresh.
        // Race with a 10-second timeout to prevent infinite spinner
        // when Supabase free tier is cold-starting.
        const sessionResult = await Promise.race([
          supabase.auth.getSession(),
          new Promise<null>(resolve => setTimeout(() => resolve(null), 10000)),
        ]);

        if (cancelled) return;

        const s = sessionResult?.data?.session ?? null;
        setSession(s);
        setUser(s?.user ?? null);

        if (s?.user) {
          const p = await fetchProfile(s.user.id);
          if (!cancelled) setProfile(p);
        }
      } catch {
        // getSession failed — user will be treated as logged out
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, s) => {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user && _event !== 'TOKEN_REFRESHED') {
          const p = await fetchProfile(s.user.id);
          if (p) setProfile(p);
        } else if (!s?.user) {
          setProfile(null);
        }
      }
    );

    return () => {
      cancelled = true;
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
