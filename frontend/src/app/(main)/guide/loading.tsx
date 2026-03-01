/**
 * @project AncestorTree
 * @file src/app/(main)/guide/loading.tsx
 * @description Loading skeleton for guide page
 * @version 1.0.0
 * @updated 2026-03-01
 */

import { Skeleton } from '@/components/ui/skeleton';

export default function GuideLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-5 w-96" />
      <Skeleton className="h-px w-full" />
      <Skeleton className="h-24 w-full" />
      <div className="space-y-2">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    </div>
  );
}
