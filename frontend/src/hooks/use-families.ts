/**
 * @project AncestorTree
 * @file src/hooks/use-families.ts
 * @description React Query hooks for families data
 * @version 1.0.0
 * @updated 2026-02-24
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getFamilies,
  getFamily,
  getFamilyChildren,
  createFamily,
  addChildToFamily,
  removeChildFromFamily,
  getTreeData,
  getFullTreeData,
  getPersonRelations,
  addPersonToParentFamily,
  createSpouseFamily,
} from '@/lib/supabase-data';
import type { Family } from '@/types';

// Query keys
export const familyKeys = {
  all: ['families'] as const,
  lists: () => [...familyKeys.all, 'list'] as const,
  details: () => [...familyKeys.all, 'detail'] as const,
  detail: (id: string) => [...familyKeys.details(), id] as const,
  children: (id: string) => [...familyKeys.all, 'children', id] as const,
  relations: (id: string) => [...familyKeys.all, 'relations', id] as const,
  tree: () => ['tree'] as const,
  fullTree: () => ['fullTree'] as const,
};

// ─── Queries ──────────────────────────────────────────────────────────────────

export function useFamilies() {
  return useQuery({
    queryKey: familyKeys.lists(),
    queryFn: getFamilies,
  });
}

export function useFamily(id: string | undefined) {
  return useQuery({
    queryKey: familyKeys.detail(id!),
    queryFn: () => getFamily(id!),
    enabled: !!id,
  });
}

export function useFamilyChildren(familyId: string | undefined) {
  return useQuery({
    queryKey: familyKeys.children(familyId!),
    queryFn: () => getFamilyChildren(familyId!),
    enabled: !!familyId,
  });
}

export function useTreeData() {
  return useQuery({
    queryKey: familyKeys.tree(),
    queryFn: getTreeData,
  });
}

export function useFullTreeData() {
  return useQuery({
    queryKey: familyKeys.fullTree(),
    queryFn: getFullTreeData,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateFamily() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (input: Omit<Family, 'id' | 'created_at' | 'updated_at'>) => 
      createFamily(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: familyKeys.all });
      queryClient.invalidateQueries({ queryKey: familyKeys.tree() });
    },
  });
}

export function useAddChildToFamily() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ familyId, personId, sortOrder }: { 
      familyId: string; 
      personId: string; 
      sortOrder: number;
    }) => addChildToFamily(familyId, personId, sortOrder),
    onSuccess: (_, { familyId }) => {
      queryClient.invalidateQueries({ queryKey: familyKeys.children(familyId) });
      queryClient.invalidateQueries({ queryKey: familyKeys.tree() });
    },
  });
}

export function useRemoveChildFromFamily() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ familyId, personId }: { familyId: string; personId: string }) =>
      removeChildFromFamily(familyId, personId),
    onSuccess: (_, { familyId }) => {
      queryClient.invalidateQueries({ queryKey: familyKeys.children(familyId) });
      queryClient.invalidateQueries({ queryKey: familyKeys.tree() });
    },
  });
}

export function usePersonRelations(personId: string | undefined) {
  return useQuery({
    queryKey: familyKeys.relations(personId!),
    queryFn: () => getPersonRelations(personId!),
    enabled: !!personId,
  });
}

export function useAddPersonToParentFamily() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      fatherId,
      motherId,
      childPersonId,
    }: {
      fatherId: string | null;
      motherId: string | null;
      childPersonId: string;
    }) => addPersonToParentFamily(fatherId, motherId, childPersonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: familyKeys.all });
      queryClient.invalidateQueries({ queryKey: familyKeys.tree() });
    },
  });
}

export function useCreateSpouseFamily() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      personId,
      personGender,
      spouseId,
    }: {
      personId: string;
      personGender: 1 | 2;
      spouseId: string;
    }) => createSpouseFamily(personId, personGender, spouseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: familyKeys.all });
      queryClient.invalidateQueries({ queryKey: familyKeys.tree() });
    },
  });
}

export function useAddChildToFamilyMutation(personId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      familyId,
      childPersonId,
      sortOrder,
    }: {
      familyId: string;
      childPersonId: string;
      sortOrder: number;
    }) => addChildToFamily(familyId, childPersonId, sortOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: familyKeys.all });
      queryClient.invalidateQueries({ queryKey: familyKeys.tree() });
      if (personId) {
        queryClient.invalidateQueries({ queryKey: familyKeys.relations(personId) });
      }
    },
  });
}
