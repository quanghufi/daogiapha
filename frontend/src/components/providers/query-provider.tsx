/**
 * @project AncestorTree
 * @file src/components/providers/query-provider.tsx
 * @description React Query provider with auth-aware retry logic
 * @version 1.2.0
 * @updated 2026-03-03
 */

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

interface QueryProviderProps {
  children: ReactNode;
}

/** Check if an error is a Supabase auth/session error (expired token, missing key, etc.) */
function isAuthError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { code?: string; message?: string; status?: number };
  // PostgREST returns 401 for expired JWT, 403 for RLS violations with bad token
  if (e.status === 401 || e.status === 403) return true;
  // "No API key found in request" or "JWT expired"
  if (e.message?.includes('API key') || e.message?.includes('JWT expired')) return true;
  if (e.code === 'PGRST301') return true; // JWT error
  return false;
}

// Track whether a session refresh is already in progress to avoid duplicate calls
let refreshPromise: Promise<boolean> | null = null;

function ensureSessionRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = supabase.auth.refreshSession()
    .then(({ error }) => !error)
    .catch(() => false)
    .finally(() => { refreshPromise = null; });
  return refreshPromise;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            retry: (failureCount, error) => {
              if (isAuthError(error)) {
                // First attempt: refresh session, then let React Query retry once.
                // Second attempt after refresh: if still failing, give up.
                if (failureCount === 0) {
                  ensureSessionRefresh();
                  return true; // retry once after refresh
                }
                return false;
              }
              return failureCount < 1;
            },
            retryDelay: (attemptIndex, error) => {
              // Give session refresh time to complete before retrying
              if (isAuthError(error)) return 1500;
              return Math.min(1000 * 2 ** attemptIndex, 5000);
            },
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  // When auth state changes (e.g. token refreshed), invalidate all queries
  // so they refetch with the fresh token.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
        queryClient.invalidateQueries();
      }
    });
    return () => subscription.unsubscribe();
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
