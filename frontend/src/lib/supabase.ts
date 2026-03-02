import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Debug: log if env vars are missing (visible in browser console)
if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
  console.error('[Supabase] Missing env vars:', {
    url: supabaseUrl ? '✓' : '✗ MISSING',
    key: supabaseAnonKey ? `✓ (${supabaseAnonKey.substring(0, 10)}...)` : '✗ MISSING'
  });
}

// Custom fetch with 30-second timeout to prevent infinite hangs on Supabase free tier cold starts.
const fetchWithTimeout: typeof fetch = async (input, init) => {
  const controller = new AbortController();
  const existingSignal = init?.signal;
  const timer = setTimeout(() => controller.abort(), 30000);

  // If the caller already has a signal, abort when either signal fires
  if (existingSignal) {
    existingSignal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  try {
    // cache: 'no-store' prevents browser from serving stale 304 responses
    // (e.g. cached "No API key" error that persists across navigations).
    const response = await fetch(input, { ...init, signal: controller.signal, cache: 'no-store' });

    // Debug: log failed Supabase responses to trace "No API key" errors
    if (typeof window !== 'undefined' && !response.ok) {
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : '';
      console.warn(`[Supabase] ${response.status} ${response.statusText} — ${url}`);
    }

    return response;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      // If the caller's signal aborted, re-throw as-is (not a timeout)
      if (existingSignal?.aborted) throw err;
      throw new Error('Yêu cầu hết thời gian chờ. Supabase đang khởi động — vui lòng thử lại sau vài giây.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
};

// Browser client using localStorage for session (no server dependency for auth).
// This avoids the "No API key" error caused by cookie-based auth + proxy.ts getUser() calls
// hitting Supabase server on every navigation (cold start / timeout → session lost).
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      global: { fetch: fetchWithTimeout },
    })
  : createClient('https://placeholder.supabase.co', 'placeholder-key');

export { supabase };

// Server-side client with service role (for admin operations)
export function createServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(supabaseUrl, serviceRoleKey);
}
