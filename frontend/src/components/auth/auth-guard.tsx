'use client';

import { useAuth } from '@/components/auth/auth-provider';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

/**
 * Client-side auth guard for protected routes inside (main) layout.
 */
const protectedPathPrefixes = ['/admin', '/settings', '/people/new'];
const protectedPathMatchers = [/^\/people\/[^/]+\/edit(?:\/|$)/];

function isProtectedPath(pathname: string): boolean {
  if (protectedPathPrefixes.some(path => pathname === path || pathname.startsWith(path + '/'))) {
    return true;
  }
  return protectedPathMatchers.some(pattern => pattern.test(pathname));
}

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const requiresAuth = isProtectedPath(pathname);

  useEffect(() => {
    if (requiresAuth && !isLoading && !user) {
      router.replace('/login');
    }
  }, [requiresAuth, isLoading, user, router]);

  // Public routes render immediately without waiting for auth resolution.
  if (!requiresAuth) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}
