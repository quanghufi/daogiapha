import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Custom fetch with 25-second timeout to prevent infinite hangs on Supabase free tier cold starts.
const fetchWithTimeout: typeof fetch = async (input, init) => {
  const controller = new AbortController();
  const existingSignal = init?.signal;
  const timer = setTimeout(() => controller.abort(), 25000);

  // If the caller already has a signal, abort when either signal fires
  if (existingSignal) {
    existingSignal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  // Debug: detect missing apikey before request is sent
  const headers = init?.headers;
  if (headers && typeof (headers as Headers).has === 'function') {
    if (!(headers as Headers).has('apikey')) {
      console.warn('[Supabase] Request missing apikey header:', typeof input === 'string' ? input : (input as Request).url);
    }
  }

  try {
    return await fetch(input, { ...init, signal: controller.signal });
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

// Browser client uses cookies (shared with proxy.ts middleware for auth routing).
// Falls back to basic client during build when env vars are missing.
const supabase = supabaseUrl && supabaseAnonKey
  ? createBrowserClient(supabaseUrl, supabaseAnonKey, {
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
