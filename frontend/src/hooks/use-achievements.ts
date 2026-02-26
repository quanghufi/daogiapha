/**
 * @project AncestorTree
 * @file src/hooks/use-achievements.ts
 * @description React Query hooks for achievements
 * @version 1.0.0
 * @updated 2026-02-25
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAchievements,
  getAchievementsByPerson,
  getFeaturedAchievements,
  createAchievement,
  updateAchievement,
  deleteAchievement,
} from '@/lib/supabase-data-achievements';
import type { AchievementCategory, CreateAchievementInput, UpdateAchievementInput } from '@/types';

export const achievementKeys = {
  all: ['achievements'] as const,
  lists: () => [...achievementKeys.all, 'list'] as const,
  list: (category?: AchievementCategory) => [...achievementKeys.lists(), { category }] as const,
  byPerson: (personId: string) => [...achievementKeys.all, 'person', personId] as const,
  featured: () => [...achievementKeys.all, 'featured'] as const,
};

export function useAchievements(category?: AchievementCategory) {
  return useQuery({
    queryKey: achievementKeys.list(category),
    queryFn: () => getAchievements(category),
  });
}

export function usePersonAchievements(personId: string | undefined) {
  return useQuery({
    queryKey: achievementKeys.byPerson(personId!),
    queryFn: () => getAchievementsByPerson(personId!),
    enabled: !!personId,
  });
}

export function useFeaturedAchievements() {
  return useQuery({
    queryKey: achievementKeys.featured(),
    queryFn: getFeaturedAchievements,
  });
}

export function useCreateAchievement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAchievementInput) => createAchievement(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: achievementKeys.all });
    },
  });
}

export function useUpdateAchievement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAchievementInput }) =>
      updateAchievement(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: achievementKeys.all });
    },
  });
}

export function useDeleteAchievement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAchievement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: achievementKeys.all });
    },
  });
}
