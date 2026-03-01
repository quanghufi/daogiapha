import { useQuery } from '@tanstack/react-query';
import { getRecentActivities } from '@/lib/supabase-data';

export function useRecentActivities(limit = 15) {
  return useQuery({
    queryKey: ['recent-activities', limit],
    queryFn: () => getRecentActivities(limit),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
