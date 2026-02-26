/**
 * @project AncestorTree
 * @file src/hooks/use-clan-articles.ts
 * @description React Query hooks for clan articles (hương ước)
 * @version 1.0.0
 * @updated 2026-02-25
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getClanArticles,
  getFeaturedArticles,
  createClanArticle,
  updateClanArticle,
  deleteClanArticle,
} from '@/lib/supabase-data-charter';
import type { ClanArticleCategory, CreateClanArticleInput, UpdateClanArticleInput } from '@/types';

export const clanArticleKeys = {
  all: ['clan-articles'] as const,
  lists: () => [...clanArticleKeys.all, 'list'] as const,
  list: (category?: ClanArticleCategory) => [...clanArticleKeys.lists(), { category }] as const,
  featured: () => [...clanArticleKeys.all, 'featured'] as const,
};

export function useClanArticles(category?: ClanArticleCategory) {
  return useQuery({
    queryKey: clanArticleKeys.list(category),
    queryFn: () => getClanArticles(category),
  });
}

export function useFeaturedArticles() {
  return useQuery({
    queryKey: clanArticleKeys.featured(),
    queryFn: getFeaturedArticles,
  });
}

export function useCreateClanArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateClanArticleInput) => createClanArticle(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clanArticleKeys.all });
    },
  });
}

export function useUpdateClanArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateClanArticleInput }) =>
      updateClanArticle(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clanArticleKeys.all });
    },
  });
}

export function useDeleteClanArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteClanArticle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clanArticleKeys.all });
    },
  });
}
