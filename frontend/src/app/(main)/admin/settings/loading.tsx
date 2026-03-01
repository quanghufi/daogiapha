import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsLoading() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-5 w-80" />
      <Skeleton className="h-px w-full" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
