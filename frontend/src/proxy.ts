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

  // getUser() can hang on Supabase free tier cold start.
  // Race with a 5-second timeout: on timeout treat user as unauthenticated
  // so public pages always load, and protected pages redirect to /login.
  let user: { id: string } | null = null;
  try {
    const result = await Promise.race([
      supabase.auth.getUser().then(r => r.data.user),
      new Promise<null>(resolve => setTimeout(() => resolve(null), 5000)),
    ]);
    user = result;
  } catch {
    user = null;
  }

  // Redirect unauthenticated users from all non-public pages
  if (!user && !publicPaths.some(path => pathname === path)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Admin routes require admin or editor role
  if (user && pathname.startsWith('/admin')) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (profile?.role !== 'admin' && profile?.role !== 'editor') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch {
      // On timeout/error, deny access to admin
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Redirect authenticated users away from auth pages
  if (user && publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
