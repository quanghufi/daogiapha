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
    // Initial auth check: use getUser() to verify with Supabase Auth server.
    // getSession() only reads from storage (cookies) and may return stale/unverified data.
    const initAuth = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          setUser(authUser);
          // Get the session for the token/expiry info
          const { data: { session: s } } = await supabase.auth.getSession();
          setSession(s);
          const p = await fetchProfile(authUser.id);
          setProfile(p);
        }
      } catch {
        // Auth server unreachable — leave as unauthenticated
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();

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

    // Proactive session health check: periodically call getUser() to verify the token
    // is still valid. If invalid, force refresh. This prevents the "data stops loading"
    // issue where the JWT silently expires and all Supabase queries fail.
    sessionCheckRef.current = setInterval(async () => {
      try {
        const { data: { user: checkUser }, error } = await supabase.auth.getUser();
        if (error || !checkUser) {
          // Token might be expired — try to refresh
          console.info('[Auth] Session check failed, attempting refresh...');
          const { data, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError || !data.session) {
            console.error('[Auth] Session refresh failed');
            setSession(null);
            setUser(null);
            setProfile(null);
          } else {
            setSession(data.session);
            setUser(data.session.user);
          }
        }
      } catch {
        // Network error during check — ignore, will retry next interval
      }
    }, SESSION_CHECK_INTERVAL);

    // Also check session when tab becomes visible again (user returns after idle)
    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const { data: { user: checkUser }, error } = await supabase.auth.getUser();
        if (error || !checkUser) {
          const { data, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError || !data.session) {
            setSession(null);
            setUser(null);
            setProfile(null);
          } else {
            setSession(data.session);
            setUser(data.session.user);
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
