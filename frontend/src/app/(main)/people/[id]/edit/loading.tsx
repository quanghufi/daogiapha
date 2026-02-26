import { Skeleton } from '@/components/ui/skeleton';

export default function PersonEditLoading() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-8 w-48" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    </div>
  );
}
