-- ═══════════════════════════════════════════════════════════════════════════
-- Update 'media' bucket: allow PDF uploads + increase size limit to 100MB
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE storage.buckets
SET
  file_size_limit = 104857600,  -- 100 MB
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf'
  ]
WHERE id = 'media';
