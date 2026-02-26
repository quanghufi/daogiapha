import { Skeleton } from '@/components/ui/skeleton';

export default function TreeLoading() {
  return (
    <div className="w-full h-[calc(100vh-4rem)]">
      <Skeleton className="w-full h-full" />
    </div>
  );
}
