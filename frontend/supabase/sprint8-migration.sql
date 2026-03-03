-- ═══════════════════════════════════════════════════════════════════════════
-- SPRINT 8 MIGRATION: Security, Verification, Documents, Settings
-- Run in Supabase SQL Editor after sprint75-migration.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══ 1. PROFILES: Verification & Suspension Columns ═══

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES profiles(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_reason TEXT;

-- CRITICAL: Verify all existing users so they don't get locked out
UPDATE profiles SET is_verified = true WHERE is_verified = false OR is_verified IS NULL;

-- ═══ 2. UPDATE handle_new_user() TRIGGER ═══
-- New signups get is_verified = false (requires admin verification)

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (user_id, email, full_name, role, is_verified, is_suspended)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        'viewer',
        false,
        false
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══ 3. RLS HARDENING ═══

-- 3a. Profiles: require authentication for reading
DROP POLICY IF EXISTS "Users can read all profiles" ON profiles;
CREATE POLICY "Authenticated users can read profiles" ON profiles
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- 3b. Profiles: allow admin to delete
CREATE POLICY "Admins can delete profiles" ON profiles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.role = 'admin'
        )
    );

-- ═══ 4. ADMIN DELETE USER FUNCTION ═══
-- SECURITY DEFINER: runs with elevated privileges to delete from auth.users

CREATE OR REPLACE FUNCTION admin_delete_user(target_user_id UUID)
RETURNS void AS $$
BEGIN
    -- Verify caller is admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Not authorized: admin role required';
    END IF;

    -- Delete profile first (avoid FK issues)
    DELETE FROM profiles WHERE user_id = target_user_id;

    -- Delete from auth.users
    DELETE FROM auth.users WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══ 5. CLAN DOCUMENTS TABLE ═══

CREATE TABLE IF NOT EXISTS clan_documents (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    category        VARCHAR(50) DEFAULT 'other'
                    CHECK (category IN ('gia_pha','lich_su','hinh_anh','van_kien','other')),
    file_url        TEXT NOT NULL,
    file_type       VARCHAR(50),
    file_size       INTEGER,
    uploaded_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE clan_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read active documents" ON clan_documents
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND is_active = true
    );

CREATE POLICY "Editors can insert documents" ON clan_documents
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role IN ('admin', 'editor')
        )
    );

CREATE POLICY "Editors can update documents" ON clan_documents
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role IN ('admin', 'editor')
        )
    );

CREATE POLICY "Admins can delete documents" ON clan_documents
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Admin/editor can also read archived documents
CREATE POLICY "Editors can read all documents" ON clan_documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role IN ('admin', 'editor')
        )
    );

CREATE INDEX IF NOT EXISTS idx_clan_documents_category ON clan_documents(category);
CREATE INDEX IF NOT EXISTS idx_clan_documents_active ON clan_documents(is_active);

-- ═══ 6. CLAN SETTINGS TABLE ═══

CREATE TABLE IF NOT EXISTS clan_settings (
    key             VARCHAR(100) PRIMARY KEY,
    value           JSONB NOT NULL DEFAULT '{}',
    description     TEXT,
    updated_by      UUID REFERENCES profiles(id),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE clan_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read settings" ON clan_settings
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert settings" ON clan_settings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can update settings" ON clan_settings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Seed default settings
INSERT INTO clan_settings (key, value, description) VALUES
    ('clan_name', '"Đào tộc - Ninh thôn"', 'Tên dòng họ'),
    ('clan_motto', '"Uống nước nhớ nguồn"', 'Khẩu hiệu'),
    ('contact_email', '""', 'Email liên hệ'),
    ('contact_phone', '""', 'Số điện thoại liên hệ'),
    ('require_verification', 'true', 'Yêu cầu admin duyệt tài khoản mới')
ON CONFLICT (key) DO NOTHING;

-- ═══ 7. STORAGE: Documents Bucket ═══
-- Run this separately in Supabase Dashboard > Storage or via:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true);
