/**
 * @project AncestorTree
 * @file src/lib/supabase-storage.ts
 * @description Supabase Storage utilities for file upload/delete
 * @version 1.0.0
 * @updated 2026-02-25
 */

import { supabase } from './supabase';
import { STORAGE_BUCKET, MAX_UPLOAD_SIZE_BYTES } from '@/lib/constants';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageError';
  }
}

export async function uploadFile(file: File, personId: string): Promise<string> {
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new StorageError('File quá lớn. Tối đa 5MB.');
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new StorageError('Định dạng không hỗ trợ. Chấp nhận: JPEG, PNG, WebP, GIF.');
  }

  const ext = file.name.split('.').pop() || 'jpg';
  const timestamp = Date.now();
  const path = `people/${personId}/${timestamp}.${ext}`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw new StorageError(error.message);

  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path);

  return urlData.publicUrl;
}

export async function deleteFile(url: string): Promise<void> {
  // Extract path from public URL
  const bucketUrl = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
  const idx = url.indexOf(bucketUrl);
  if (idx === -1) {
    console.warn('[Storage] Cannot parse storage path — skipping delete');
    return;
  }

  const path = decodeURIComponent(url.slice(idx + bucketUrl.length));
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([path]);

  if (error) throw new StorageError(error.message);
}
