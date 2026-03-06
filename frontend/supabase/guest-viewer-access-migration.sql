-- ============================================================================
-- Guest viewer access hotfix
-- Allow anonymous users to read active clan documents (viewer pages)
-- Run after sprint8-migration.sql
-- ============================================================================

-- Replace authenticated-only read policy with public read for active documents
DROP POLICY IF EXISTS "Authenticated users can read active documents" ON clan_documents;
DROP POLICY IF EXISTS "Anyone can read active documents" ON clan_documents;

CREATE POLICY "Anyone can read active documents" ON clan_documents
    FOR SELECT USING (is_active = true);
