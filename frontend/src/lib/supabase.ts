import { createBrowserClient } from '@supabase/ssr';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Custom fetch with 25-second timeout to prevent infinite hangs on Supabase free tier cold starts.
const fetchWithTimeout: typeof fetch = async (input, init) => {
  const controller = new AbortController();
  const existingSignal = init?.signal;
  const timer = setTimeout(() => controller.abort(), 25000);

  if (existingSignal) {
    existingSignal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  try {
    const method = (init?.method || 'GET').toUpperCase();
    const fetchInit = { ...init, signal: controller.signal };
    if (method === 'GET') {
      (fetchInit as Record<string, unknown>).cache = 'no-store';
    }
    return await fetch(input, fetchInit);
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      if (existingSignal?.aborted) throw err;
      throw new Error('Yêu cầu hết thời gian chờ. Supabase đang khởi động — vui lòng thử lại sau vài giây.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
};

// No-op lock: bypasses Navigator LockManager to avoid 10s lock timeout errors
// caused by @supabase/ssr holding the Web Lock across hot-reload or multiple tabs.
const noopLock = async <T>(_name: string, _timeout: number, fn: () => Promise<T>): Promise<T> => fn();

function createSupabaseClient(): SupabaseClient {
  if (supabaseUrl && supabaseAnonKey) {
    return createBrowserClient(supabaseUrl, supabaseAnonKey, {
      global: { fetch: fetchWithTimeout },
      auth: { lock: process.env.NODE_ENV === 'development' ? noopLock : undefined },
      cookieOptions: {
        path: '/',
        maxAge: 3600,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      },
    });
  }
  return createClient('https://placeholder.supabase.co', 'placeholder-key');
}

const supabase = createSupabaseClient();
export { supabase };

// Server-side client with service role (for admin operations)
export function createServiceRoleClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(supabaseUrl, serviceRoleKey);
}

// Alias — existing API routes import this name
export { createServiceRoleClient as createServerClient };
