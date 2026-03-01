/**
 * @project AncestorTree
 * @file src/components/providers/query-provider.tsx
 * @description React Query provider with auth-aware retry logic
 * @version 1.1.0
 * @updated 2026-03-01
 */

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
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

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            retry: (failureCount, error) => {
              // Don't retry auth errors — trigger session refresh instead
              if (isAuthError(error)) {
                supabase.auth.refreshSession().catch(() => {});
                return false;
              }
              return failureCount < 1;
            },
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
