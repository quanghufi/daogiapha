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

    const completeInit = () => {
      if (!cancelled && !initializedRef.current) {
        initializedRef.current = true;
        setIsLoading(false);
      }
    };

    // Hard failsafe: force isLoading=false after 8s no matter what.
    const failsafe = setTimeout(() => {
      if (!cancelled && !initializedRef.current) {
        console.warn('[Auth] Failsafe timeout — forcing auth load complete');
        completeInit();
      }
    }, 8000);

    const initAuth = async () => {
      try {
        const { data: { session: s }, error } = await supabase.auth.getSession();
        if (cancelled) return;

        if (error || !s) {
          // Session missing or invalid — try refreshing the token
          console.warn('[Auth] getSession failed, attempting refresh...', error?.message);
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          if (cancelled) return;

          if (refreshError || !refreshData.session) {
            // Refresh also failed — stale session in localStorage, clear it
            console.warn('[Auth] refreshSession failed — signing out stale session');
            await supabase.auth.signOut();
            if (!cancelled) {
              setSession(null);
              setUser(null);
              setProfile(null);
            }
            return;
          }

          // Refresh succeeded — use the new session
          setSession(refreshData.session);
          setUser(refreshData.session.user);
          const p = await fetchProfile(refreshData.session.user.id);
          if (!cancelled) setProfile(p);
          return;
        }

        // Normal path — getSession succeeded
        setSession(s);
        setUser(s.user);
        const p = await fetchProfile(s.user.id);
        if (!cancelled) setProfile(p);
      } catch (err) {
        console.error('[Auth] Error checking session:', err);
      } finally {
        completeInit();
      }
    };

    // Start explicit session check
    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, s) => {
        if (cancelled) return;

        setSession(s);
        setUser(s?.user ?? null);

        if (event === 'SIGNED_IN') {
          const p = s?.user ? await fetchProfile(s.user.id) : null;
          if (!cancelled) setProfile(p);
          completeInit();
        } else if (event === 'SIGNED_OUT') {
          if (!cancelled) setProfile(null);
          completeInit();
        } else if (event === 'INITIAL_SESSION') {
          // Handled by initAuth mostly, but if this fires first:
          completeInit();
        }
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
