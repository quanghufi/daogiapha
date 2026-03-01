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

// How often to proactively check session health (ms)
const SESSION_CHECK_INTERVAL = 4 * 60 * 1000; // 4 minutes

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
  const sessionCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const p = await fetchProfile(user.id);
    setProfile(p);
  }, [user]);

  useEffect(() => {
    // Initial session check + profile fetch
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        const p = await fetchProfile(s.user.id);
        setProfile(p);
      }
      setIsLoading(false);
    });

    // Listen for auth changes (skip profile fetch on TOKEN_REFRESHED to avoid spurious DB calls)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, s) => {
        setSession(s);
        setUser(s?.user ?? null);

        if (s?.user && event !== 'TOKEN_REFRESHED') {
          const p = await fetchProfile(s.user.id);
          setProfile(p);
        } else if (!s?.user) {
          setProfile(null);
        }
      }
    );

    // Proactive session health check: periodically verify the token is still valid
    // and force a refresh before it expires. This prevents the "data stops loading"
    // issue where the JWT silently expires and all Supabase queries fail.
    sessionCheckRef.current = setInterval(async () => {
      try {
        const { data: { session: current } } = await supabase.auth.getSession();
        if (!current) return;

        // Check if token expires within the next 5 minutes
        const expiresAt = current.expires_at; // unix seconds
        if (expiresAt) {
          const secondsUntilExpiry = expiresAt - Math.floor(Date.now() / 1000);
          if (secondsUntilExpiry < 300) {
            console.info('[Auth] Token expiring soon, refreshing...');
            const { data, error } = await supabase.auth.refreshSession();
            if (error) {
              console.error('[Auth] Session refresh failed:', error.message);
              // Session is dead — sign out to force re-login instead of broken state
              setSession(null);
              setUser(null);
              setProfile(null);
            } else if (data.session) {
              setSession(data.session);
              setUser(data.session.user);
            }
          }
        }
      } catch {
        // Network error during check — ignore, will retry next interval
      }
    }, SESSION_CHECK_INTERVAL);

    // Also refresh session when tab becomes visible again (user returns after idle)
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const { data: { session: current } } = await supabase.auth.getSession();
        if (!current) {
          // Session gone while tab was hidden
          setSession(null);
          setUser(null);
          setProfile(null);
          return;
        }
        const expiresAt = current.expires_at;
        if (expiresAt) {
          const secondsUntilExpiry = expiresAt - Math.floor(Date.now() / 1000);
          if (secondsUntilExpiry < 300) {
            const { data, error } = await supabase.auth.refreshSession();
            if (error) {
              setSession(null);
              setUser(null);
              setProfile(null);
            } else if (data.session) {
              setSession(data.session);
              setUser(data.session.user);
            }
          }
        }
      } catch {
        // Ignore network errors
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      if (sessionCheckRef.current) clearInterval(sessionCheckRef.current);
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
