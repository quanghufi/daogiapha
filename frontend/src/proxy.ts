/**
 * @project AncestorTree
 * @file src/proxy.ts
 * @description Next.js 16 proxy — lightweight pass-through.
 * Auth is handled entirely client-side via AuthProvider + useAuth().
 * No server-side Supabase calls on navigation (prevents cold start / "No API key" errors).
 * @version 2.0.0
 * @updated 2026-03-03
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  // All route protection is client-side (useAuth hook in layout/pages).
  // This proxy is a lightweight pass-through — no Supabase server calls.
  return NextResponse.next({
    request: { headers: request.headers },
  });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
