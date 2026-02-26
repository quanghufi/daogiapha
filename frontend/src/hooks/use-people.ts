/**
 * @project AncestorTree
 * @file src/hooks/use-people.ts
 * @description React Query hooks for people data
 * @version 1.0.0
 * @updated 2026-02-24
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPeople,
  getPerson,
  createPerson,
  updatePerson,
  deletePerson,
  searchPeople,
  getPeopleByGeneration,
  getStats,
  cascadeGenerationUpdate,
} from '@/lib/supabase-data';
import type { CreatePersonInput, UpdatePersonInput } from '@/types';

// Query keys
export const peopleKeys = {
  all: ['people'] as const,
  lists: () => [...peopleKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...peopleKeys.lists(), filters] as const,
  details: () => [...peopleKeys.all, 'detail'] as const,
  detail: (id: string) => [...peopleKeys.details(), id] as const,
  search: (query: string) => [...peopleKeys.all, 'search', query] as const,
  byGeneration: (gen: number) => [...peopleKeys.all, 'generation', gen] as const,
  stats: () => [...peopleKeys.all, 'stats'] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function usePeople() {
  return useQuery({
    queryKey: peopleKeys.lists(),
    queryFn: getPeople,
  });
}

export function usePerson(id: string | undefined) {
  return useQuery({
    queryKey: peopleKeys.detail(id!),
    queryFn: () => getPerson(id!),
    enabled: !!id,
  });
}

export function useSearchPeople(query: string) {
  return useQuery({
    queryKey: peopleKeys.search(query),
    queryFn: () => searchPeople(query),
    enabled: query.length >= 2,
  });
}

export function usePeopleByGeneration(generation: number) {
  return useQuery({
    queryKey: peopleKeys.byGeneration(generation),
    queryFn: () => getPeopleByGeneration(generation),
  });
}

export function useStats() {
  return useQuery({
    queryKey: peopleKeys.stats(),
    queryFn: getStats,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreatePerson() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (input: CreatePersonInput) => createPerson(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: peopleKeys.all });
    },
  });
}

export function useUpdatePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input, oldGeneration }: { id: string; input: UpdatePersonInput; oldGeneration?: number }) => {
      const updated = await updatePerson(id, input);
      // Cascade generation change to all descendants
      if (oldGeneration !== undefined && input.generation !== undefined && input.generation !== oldGeneration) {
        await cascadeGenerationUpdate(id, input.generation - oldGeneration);
      }
      return updated;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: peopleKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: peopleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['tree'] });
    },
  });
}

export function useDeletePerson() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deletePerson(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: peopleKeys.all });
    },
  });
}
