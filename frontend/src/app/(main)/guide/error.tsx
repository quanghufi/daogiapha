/**
 * @project AncestorTree
 * @file src/app/(main)/guide/error.tsx
 * @description Error boundary for guide page
 * @version 1.0.0
 * @updated 2026-03-01
 */

'use client';

import { RouteError } from '@/components/shared/route-error';

export default function GuideError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError error={error} reset={reset} title="Lỗi tải trang hướng dẫn" />;
}
