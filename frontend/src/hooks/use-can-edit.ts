/**
 * @project AncestorTree
 * @file src/hooks/use-can-edit.ts
 * @description FR-508/510 — Hook to check if current user can edit a given person.
 *   - admin: always true
 *   - editor, no edit_root_person_id: always true (global editor)
 *   - editor, edit_root_person_id set: true only if person is in their subtree
 *   - viewer with linked_person = personId: true (self-service own record)
 *   - viewer otherwise: false
 * @version 1.0.0
 * @updated 2026-02-25
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/auth/auth-provider';
import { checkPersonInSubtree } from '@/lib/supabase-data';

export function useCanEditPerson(personId: string | undefined) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['canEdit', profile?.user_id, personId],
    queryFn: async (): Promise<boolean> => {
      if (!profile || !personId) return false;

      // Admin: full access
      if (profile.role === 'admin') return true;

      // Editor with no subtree restriction: global access
      if (profile.role === 'editor' && !profile.edit_root_person_id) return true;

      // Any role: user can edit their own linked person's record
      if (profile.linked_person === personId) return true;

      // Editor with subtree restriction: check if person is in their subtree
      if (profile.role === 'editor' && profile.edit_root_person_id) {
        return checkPersonInSubtree(profile.edit_root_person_id, personId);
      }

      return false;
    },
    enabled: !!personId && !!profile,
  });
}
