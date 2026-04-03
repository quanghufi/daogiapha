'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDocuments,
  getAllDocuments,
  getDocument,
  createDocument,
  updateDocument,
  archiveDocument,
  restoreDocument,
  deleteDocument,
} from '@/lib/supabase-data-documents';
import type { DocumentCategory, CreateClanDocumentInput, UpdateClanDocumentInput } from '@/types';

export const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (category?: DocumentCategory) => [...documentKeys.lists(), { category }] as const,
  adminList: (category?: DocumentCategory) => [...documentKeys.all, 'admin', { category }] as const,
  details: () => [...documentKeys.all, 'detail'] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,
};

export function useDocuments(category?: DocumentCategory) {
  return useQuery({
    queryKey: documentKeys.list(category),
    queryFn: () => getDocuments(category),
  });
}

export function useAllDocuments(category?: DocumentCategory) {
  return useQuery({
    queryKey: documentKeys.adminList(category),
    queryFn: () => getAllDocuments(category),
  });
}

export function useDocument(id: string | undefined) {
  return useQuery({
    queryKey: documentKeys.detail(id!),
    queryFn: () => getDocument(id!),
    enabled: !!id,
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateClanDocumentInput) => createDocument(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateClanDocumentInput }) =>
      updateDocument(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    },
  });
}

export function useArchiveDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => archiveDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
}

export function useRestoreDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => restoreDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    },
  });
}
