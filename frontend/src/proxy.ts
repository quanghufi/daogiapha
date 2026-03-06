/**
 * @project AncestorTree
 * @file src/proxy.ts
 * @description Auth middleware for protected routes — Next.js 16 convention
 * @version 1.6.0
 * @updated 2026-03-03
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient as createSSRClient } from '@supabase/ssr';

// ─── Rate Limiting ────────────────────────────────────────────────────────────

interface RateEntry { count: number; windowStart: number; }

const _rateLimitStore = new Map<string, RateEntry>();

const RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  '/login':           { max: 20, windowMs: 60_000 },
  '/register':        { max: 10, windowMs: 60_000 },
  '/forgot-password': { max:  6, windowMs: 300_000 },
  '/reset-password':  { max: 10, windowMs: 60_000 },
};

function _getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    '0.0.0.0'
  );
}

function _checkRateLimit(ip: string, pathname: string): { allowed: boolean; retryAfterSec: number } {
  const cfg = RATE_LIMITS[pathname];
  if (!cfg) return { allowed: true, retryAfterSec: 0 };

  const key = `${ip}:${pathname}`;
  const now = Date.now();
  const entry = _rateLimitStore.get(key);

  if (!entry || now - entry.windowStart > cfg.windowMs) {
    _rateLimitStore.set(key, { count: 1, windowStart: now });
    return { allowed: true, retryAfterSec: 0 };
  }

  if (entry.count >= cfg.max) {
    const retryAfterSec = Math.ceil((cfg.windowMs - (now - entry.windowStart)) / 1000);
    return { allowed: false, retryAfterSec };
  }

  entry.count++;
  return { allowed: true, retryAfterSec: 0 };
}

const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/pending-verification', '/account-suspended', '/api/debug'];
const authPagePaths = ['/login', '/register', '/forgot-password', '/reset-password'];
const statusPagePaths = ['/pending-verification', '/account-suspended'];
const protectedPathPrefixes = ['/admin', '/settings', '/people/new'];
const protectedPathMatchers = [/^\/people\/[^/]+\/edit(?:\/|$)/];

function isProtectedPath(pathname: string): boolean {
  if (protectedPathPrefixes.some(path => pathname === path || pathname.startsWith(path + '/'))) {
    return true;
  }
  return protectedPathMatchers.some(pattern => pattern.test(pathname));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate limiting
  if (pathname in RATE_LIMITS) {
    const ip = _getClientIp(request);
    const { allowed, retryAfterSec } = _checkRateLimit(ip, pathname);
    if (!allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.', retryAfter: retryAfterSec }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfterSec),
          },
        }
      );
    }
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Auth check with 5s timeout
  let user: { id: string } | null = null;
  try {
    const timeoutFlag = Symbol('timeout');
    const result = await Promise.race([
      supabase.auth.getUser().then(r => r.data.user),
      new Promise<typeof timeoutFlag>(resolve => setTimeout(() => resolve(timeoutFlag), 5000)),
    ]);
    if (result !== timeoutFlag) {
      user = result as { id: string } | null;
    }
  } catch {
    user = null;
  }

  // Public paths
  if (publicPaths.some(path => pathname === path || pathname.startsWith(path + '/'))) {
    if (user && authPagePaths.some(p => pathname === p || pathname.startsWith(p + '/'))) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return response;
  }

  const requiresAuth = isProtectedPath(pathname);

  // Unauthenticated redirect
  if (!user && requiresAuth) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verification & suspension check (for authenticated users on protected pages)
  if (user && requiresAuth && !statusPagePaths.some(p => pathname === p) && !pathname.startsWith('/api/')) {
    try {
      const { data: statusProfile } = await supabase
        .from('profiles')
        .select('is_verified, is_suspended, role')
        .eq('user_id', user.id)
        .single();

      if (statusProfile) {
        // Unverified users → redirect to pending page
        if (!statusProfile.is_verified) {
          return NextResponse.redirect(new URL('/pending-verification', request.url));
        }
        // Suspended users → redirect to suspended page
        if (statusProfile.is_suspended) {
          return NextResponse.redirect(new URL('/account-suspended', request.url));
        }
        // Admin role check (reuse profile from above)
        if (pathname.startsWith('/admin')) {
          if (statusProfile.role !== 'admin' && statusProfile.role !== 'editor') {
            return NextResponse.redirect(new URL('/', request.url));
          }
        }
      }
    } catch {
      // If profile query fails, allow through (fail-open for existing sessions)
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
