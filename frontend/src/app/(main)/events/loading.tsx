import { Skeleton } from '@/components/ui/skeleton';

export default function EventsLoading() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
