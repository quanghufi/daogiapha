-- ============================================================================
-- Guest clan settings access hotfix
-- Allow anonymous users to read public clan metadata like name and motto
-- Run after sprint8-migration.sql
-- ============================================================================

DROP POLICY IF EXISTS "Anyone authenticated can read settings" ON clan_settings;
DROP POLICY IF EXISTS "Anyone can read clan settings" ON clan_settings;

CREATE POLICY "Anyone can read clan settings" ON clan_settings
    FOR SELECT USING (true);
