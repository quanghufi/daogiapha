/**
 * @project AncestorTree
 * @file src/proxy.ts
 * @description Auth proxy (middleware) for protected routes — Next.js 16 convention
 * @version 1.1.0
 * @updated 2026-02-25
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const publicPaths = ['/', '/login', '/register', '/forgot-password', '/reset-password'];
const authPages = ['/login', '/register', '/forgot-password', '/reset-password'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
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

  // IMPORTANT: Call getUser() to refresh session cookies via setAll().
  // This ensures expired tokens get refreshed on every navigation.
  // We use getUser() instead of getSession() because getSession() doesn't
  // verify or refresh tokens — it just reads stale cookies.
  //
  // On free tier, getUser() may timeout — in that case, fall back to
  // getSession() for the routing decision (we already triggered the
  // cookie refresh attempt above).
  let user: { id: string } | null = null;
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    user = authUser;
  } catch {
    // getUser() failed (timeout/network) — fallback to session from cookies
    // This avoids redirecting to login on transient failures
    try {
      const { data: { session } } = await supabase.auth.getSession();
      user = session?.user ?? null;
    } catch {
      user = null;
    }
  }

  // Redirect unauthenticated users from all non-public pages
  if (!user && !publicPaths.some(path => pathname === path)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Admin routes require admin or editor role — checked client-side via AuthProvider.
  // Removed server-side profile query here because on free tier it causes timeouts
  // that wrongly redirect admins to homepage and can corrupt the perceived role.

  // Redirect authenticated users away from auth pages (not homepage)
  if (user && authPages.some(path => pathname === path)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
