-- ═══════════════════════════════════════════════════════════════════════════
-- Supabase Storage Setup for AncestorTree
-- Run this in Supabase SQL Editor or Dashboard → Storage
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Create the 'media' storage bucket (public access for reading)
-- Note: This is typically done via Supabase Dashboard → Storage → New Bucket
-- Settings:
--   Name: media
--   Public: true
--   File size limit: 100MB (104857600 bytes)
--   Allowed MIME types: image/jpeg, image/png, image/webp, image/gif, application/pdf

-- 2. Storage RLS policies

-- Allow editors and admins to upload files to the media bucket
CREATE POLICY "Editors and admins can upload media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'media'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'editor')
  )
);

-- Allow anyone to view/download media files
CREATE POLICY "Anyone can view media"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

-- Allow editors and admins to delete media files
CREATE POLICY "Editors and admins can delete media"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'media'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'editor')
  )
);

-- Allow editors and admins to update media files
CREATE POLICY "Editors and admins can update media"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'media'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'editor')
  )
);
