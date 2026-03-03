'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClanSettings, updateClanSettings } from '@/lib/supabase-data-clan-settings';
import type { ClanSettings } from '@/types';

export const clanSettingsKeys = {
  all: ['clan-settings'] as const,
};

export function useClanSettings() {
  return useQuery({
    queryKey: clanSettingsKeys.all,
    queryFn: getClanSettings,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateClanSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: Partial<ClanSettings>) => updateClanSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clanSettingsKeys.all });
    },
  });
}
