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
    if (p) setProfile(p); // Only update if fetch succeeded — preserve existing profile on failure
  }, [user]);

  useEffect(() => {
    // Initial auth: read session from cookies (fast, no network call).
    // Supabase SDK handles token refresh automatically via onAuthStateChange.
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        const p = await fetchProfile(s.user.id);
        setProfile(p);
      }
      setIsLoading(false);
    });

    // Listen for all auth changes — SDK handles token refresh automatically.
    // Skip profile re-fetch on TOKEN_REFRESHED to avoid unnecessary DB calls.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, s) => {
        setSession(s);
        setUser(s?.user ?? null);

        if (s?.user && event !== 'TOKEN_REFRESHED') {
          const p = await fetchProfile(s.user.id);
          if (p) setProfile(p); // Preserve existing profile on fetch failure
        } else if (!s?.user) {
          setProfile(null);
        }
      }
    );

    // Proactive session refresh: when user returns to app after idle (tab switch,
    // screen-off, or simply not interacting for 10+ minutes), check if the token
    // is near expiry and refresh it BEFORE any navigation/query triggers a 401.
    // This prevents the "blank page after idle" problem.
    let lastActivity = Date.now();
    const IDLE_THRESHOLD = 10 * 60 * 1000; // 10 minutes

    const refreshIfNeeded = () => {
      supabase.auth.getSession().then(({ data: { session: s } }) => {
        if (!s) return;
        const expiresAt = s.expires_at ?? 0;
        const now = Math.floor(Date.now() / 1000);
        // Refresh if token expires within 5 minutes
        if (expiresAt - now < 300) {
          supabase.auth.refreshSession();
        }
      });
    };

    // Visibility change: tab was hidden and came back
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshIfNeeded();
        lastActivity = Date.now();
      }
    };

    // User interaction after idle: click or keydown after 10+ min of no activity
    const handleUserActivity = () => {
      const idleTime = Date.now() - lastActivity;
      lastActivity = Date.now();
      if (idleTime > IDLE_THRESHOLD) {
        refreshIfNeeded();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('click', handleUserActivity, { capture: true });
    document.addEventListener('keydown', handleUserActivity, { capture: true });

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('click', handleUserActivity, { capture: true });
      document.removeEventListener('keydown', handleUserActivity, { capture: true });
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
