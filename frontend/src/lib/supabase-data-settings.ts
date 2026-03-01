/**
 * @project AncestorTree
 * @file src/lib/supabase-data-settings.ts
 * @description Backup (export), Restore (import) & Reset all data tables
 * @version 1.1.0
 * @updated 2026-03-01
 */

import { createServerClient } from '@/lib/supabase';

const DATA_TABLES = [
  'people',
  'families',
  'children',
  'events',
  'contributions',
  'media',
  'achievements',
  'fund_transactions',
  'scholarships',
  'clan_articles',
  'cau_duong_pools',
  'cau_duong_assignments',
] as const;

const RESET_TABLES_ORDER = [
  // Delete in reverse-dependency order (children first)
  'cau_duong_assignments',
  'cau_duong_pools',
  'scholarships',
  'contributions',
  'media',
  'achievements',
  'children',
  'events',
  'fund_transactions',
  'clan_articles',
  'families',
  'people',
] as const;

// Insert order: parent tables first, then children
const RESTORE_TABLES_ORDER = [
  'people',
  'families',
  'children',
  'events',
  'contributions',
  'media',
  'achievements',
  'fund_transactions',
  'scholarships',
  'clan_articles',
  'cau_duong_pools',
  'cau_duong_assignments',
] as const;

export interface BackupFile {
  exported_at: string;
  version: string;
  tables: Record<string, Record<string, unknown>[]>;
}

export function validateBackupFile(data: unknown): data is BackupFile {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  if (!obj.exported_at || !obj.version || !obj.tables) return false;
  if (typeof obj.tables !== 'object') return false;
  return true;
}

export async function exportAllData() {
  const admin = createServerClient();
  const backup: Record<string, unknown[]> = {};

  for (const table of DATA_TABLES) {
    const { data, error } = await admin.from(table).select('*');
    if (error) throw new Error(`Lỗi khi đọc bảng ${table}: ${error.message}`);
    backup[table] = data || [];
  }

  return {
    exported_at: new Date().toISOString(),
    version: '1.0',
    tables: backup,
  };
}

export async function resetAllData() {
  const admin = createServerClient();
  const deleted: Record<string, number> = {};

  // 1. Delete storage files in 'media' bucket
  const { data: mediaFiles } = await admin.storage.from('media').list('people', {
    limit: 1000,
  });
  // Media is stored under people/{personId}/ — list top-level folders then clear each
  const { data: topFolders } = await admin.storage.from('media').list('people');
  if (topFolders) {
    for (const folder of topFolders) {
      const { data: files } = await admin.storage.from('media').list(`people/${folder.name}`);
      if (files && files.length > 0) {
        const paths = files.map(f => `people/${folder.name}/${f.name}`);
        await admin.storage.from('media').remove(paths);
      }
    }
  }

  // 2. Delete data tables in safe order
  for (const table of RESET_TABLES_ORDER) {
    const { data, error } = await admin.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000').select('id');
    if (error) throw new Error(`Lỗi khi xóa bảng ${table}: ${error.message}`);
    deleted[table] = data?.length || 0;
  }

  // 3. Reset non-admin profiles: delete them
  const { data: deletedProfiles, error: profileDelError } = await admin
    .from('profiles')
    .delete()
    .neq('role', 'admin')
    .select('id');
  if (profileDelError) throw new Error(`Lỗi khi xóa profiles: ${profileDelError.message}`);
  deleted['profiles_deleted'] = deletedProfiles?.length || 0;

  // 4. Reset admin profiles: clear linked_person and edit_root_person_id
  const { error: profileResetError } = await admin
    .from('profiles')
    .update({ linked_person: null, edit_root_person_id: null })
    .eq('role', 'admin');
  if (profileResetError) throw new Error(`Lỗi khi reset admin profiles: ${profileResetError.message}`);

  return {
    reset_at: new Date().toISOString(),
    deleted,
  };
}

export async function restoreFromBackup(backup: BackupFile) {
  const admin = createServerClient();
  const restored: Record<string, number> = {};

  // 1. Clear existing data first (same as reset, but skip profile deletion)
  for (const table of RESET_TABLES_ORDER) {
    const { error } = await admin.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw new Error(`Lỗi khi xóa bảng ${table} trước restore: ${error.message}`);
  }

  // 2. Insert data in dependency order (parents first)
  for (const table of RESTORE_TABLES_ORDER) {
    const rows = backup.tables[table];
    if (!rows || rows.length === 0) {
      restored[table] = 0;
      continue;
    }

    // Insert in batches of 500 to avoid payload limits
    const BATCH_SIZE = 500;
    let inserted = 0;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const { error } = await admin.from(table).upsert(batch, { onConflict: 'id' });
      if (error) throw new Error(`Lỗi khi restore bảng ${table}: ${error.message}`);
      inserted += batch.length;
    }
    restored[table] = inserted;
  }

  return {
    restored_at: new Date().toISOString(),
    backup_date: backup.exported_at,
    restored,
  };
}
