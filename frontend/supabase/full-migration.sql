-- ═══════════════════════════════════════════════════════════════════════════
-- Gia Phả Điện Tử - Database Setup
-- Họ Đặng làng Kỷ Các
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════════════════
-- TABLES
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. People table
CREATE TABLE IF NOT EXISTS people (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    handle          VARCHAR(50) UNIQUE NOT NULL,
    display_name    VARCHAR(255) NOT NULL,
    first_name      VARCHAR(100),
    middle_name     VARCHAR(100),
    surname         VARCHAR(100),
    gender          SMALLINT CHECK (gender IN (1, 2)), -- 1=Male, 2=Female
    generation      INTEGER NOT NULL DEFAULT 1,
    chi             INTEGER,
    
    -- Birth
    birth_date      DATE,
    birth_year      INTEGER,
    birth_place     VARCHAR(255),
    
    -- Death
    death_date      DATE,
    death_year      INTEGER,
    death_place     VARCHAR(255),
    death_lunar     VARCHAR(20), -- Lunar date: "15/7"
    
    -- Status
    is_living       BOOLEAN DEFAULT true,
    is_patrilineal  BOOLEAN DEFAULT true,
    
    -- Contact
    phone           VARCHAR(20),
    email           VARCHAR(255),
    zalo            VARCHAR(50),
    facebook        VARCHAR(255),
    address         TEXT,
    hometown        VARCHAR(255),
    
    -- Bio
    occupation      VARCHAR(255),
    biography       TEXT,
    notes           TEXT,
    avatar_url      TEXT,
    
    -- Privacy: 0=public, 1=members only, 2=private
    privacy_level   SMALLINT DEFAULT 0,
    
    -- Timestamps
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Families table
CREATE TABLE IF NOT EXISTS families (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    handle          VARCHAR(50) UNIQUE NOT NULL,
    father_id       UUID REFERENCES people(id) ON DELETE SET NULL,
    mother_id       UUID REFERENCES people(id) ON DELETE SET NULL,
    marriage_date   DATE,
    marriage_place  VARCHAR(255),
    divorce_date    DATE,
    notes           TEXT,
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Children junction table
CREATE TABLE IF NOT EXISTS children (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id       UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    person_id       UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(family_id, person_id)
);

-- 4. Profiles (user accounts)
CREATE TABLE IF NOT EXISTS profiles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email           VARCHAR(255),
    full_name       VARCHAR(255),
    role            VARCHAR(20) DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
    linked_person   UUID REFERENCES people(id) ON DELETE SET NULL,
    avatar_url      TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Contributions (edit suggestions)
CREATE TABLE IF NOT EXISTS contributions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
    target_person   UUID REFERENCES people(id) ON DELETE CASCADE,
    change_type     VARCHAR(20) CHECK (change_type IN ('create', 'update', 'delete')),
    changes         JSONB,
    reason          TEXT,
    status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reviewed_at     TIMESTAMPTZ,
    review_notes    TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Events (memorial days)
CREATE TABLE IF NOT EXISTS events (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    event_date      DATE,
    event_lunar     VARCHAR(20),
    event_type      VARCHAR(50) DEFAULT 'other' CHECK (event_type IN ('gio', 'hop_ho', 'le_tet', 'other')),
    person_id       UUID REFERENCES people(id) ON DELETE SET NULL,
    location        VARCHAR(255),
    recurring       BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Media (photos, documents)
CREATE TABLE IF NOT EXISTS media (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_id       UUID REFERENCES people(id) ON DELETE CASCADE,
    type            VARCHAR(20) DEFAULT 'photo' CHECK (type IN ('photo', 'document', 'video')),
    url             TEXT NOT NULL,
    caption         TEXT,
    is_primary      BOOLEAN DEFAULT false,
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_people_surname ON people(surname);
CREATE INDEX IF NOT EXISTS idx_people_generation ON people(generation);
CREATE INDEX IF NOT EXISTS idx_people_chi ON people(chi);
CREATE INDEX IF NOT EXISTS idx_people_display_name ON people USING GIN(to_tsvector('simple', display_name));

CREATE INDEX IF NOT EXISTS idx_families_father ON families(father_id);
CREATE INDEX IF NOT EXISTS idx_families_mother ON families(mother_id);

CREATE INDEX IF NOT EXISTS idx_children_family ON children(family_id);
CREATE INDEX IF NOT EXISTS idx_children_person ON children(person_id);

CREATE INDEX IF NOT EXISTS idx_profiles_user ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_contributions_status ON contributions(status);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);

-- ═══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- People policies
CREATE POLICY "Public read for public people" ON people
    FOR SELECT USING (privacy_level = 0);

CREATE POLICY "Members can read all people" ON people
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid())
    );

CREATE POLICY "Admins and editors can insert people" ON people
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role IN ('admin', 'editor')
        )
    );

CREATE POLICY "Admins and editors can update people" ON people
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role IN ('admin', 'editor')
        )
    );

CREATE POLICY "Admins can delete people" ON people
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Families policies (similar pattern)
CREATE POLICY "Anyone can read families" ON families FOR SELECT USING (true);

CREATE POLICY "Admins and editors can manage families" ON families
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role IN ('admin', 'editor')
        )
    );

-- Children policies
CREATE POLICY "Anyone can read children" ON children FOR SELECT USING (true);

CREATE POLICY "Admins and editors can manage children" ON children
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role IN ('admin', 'editor')
        )
    );

-- Profiles policies
CREATE POLICY "Users can read all profiles" ON profiles FOR SELECT USING (true);

CREATE POLICY "Service role can insert profiles" ON profiles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any profile" ON profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid() 
            AND p.role = 'admin'
        )
    );

-- Events policies
CREATE POLICY "Anyone can read events" ON events FOR SELECT USING (true);

CREATE POLICY "Admins and editors can manage events" ON events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role IN ('admin', 'editor')
        )
    );

-- Media policies
CREATE POLICY "Anyone can read media" ON media FOR SELECT USING (true);

CREATE POLICY "Admins and editors can manage media" ON media
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role IN ('admin', 'editor')
        )
    );

-- Contributions policies
CREATE POLICY "Users can read own contributions" ON contributions
    FOR SELECT USING (
        author_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Members can create contributions" ON contributions
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid())
    );

CREATE POLICY "Admins can update contributions" ON contributions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- ═══════════════════════════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (user_id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        'viewer'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ═══════════════════════════════════════════════════════════════════════════
-- SEED DATA (Sample Family)
-- ═══════════════════════════════════════════════════════════════════════════

-- Uncomment to add sample data
/*
INSERT INTO people (handle, display_name, surname, first_name, gender, generation, chi, birth_year, is_living, is_patrilineal) VALUES
('P001', 'Đặng Văn Thủy Tổ', 'Đặng', 'Thủy Tổ', 1, 1, 1, 1850, false, true),
('P002', 'Nguyễn Thị A', 'Nguyễn', 'A', 2, 1, 1, 1855, false, false),
('P003', 'Đặng Văn B', 'Đặng', 'B', 1, 2, 1, 1880, false, true),
('P004', 'Đặng Văn C', 'Đặng', 'C', 1, 2, 1, 1882, false, true),
('P005', 'Đặng Thị D', 'Đặng', 'D', 2, 2, 1, 1885, false, true);

INSERT INTO families (handle, father_id, mother_id) VALUES
('F001', (SELECT id FROM people WHERE handle = 'P001'), (SELECT id FROM people WHERE handle = 'P002'));

INSERT INTO children (family_id, person_id, sort_order) VALUES
((SELECT id FROM families WHERE handle = 'F001'), (SELECT id FROM people WHERE handle = 'P003'), 1),
((SELECT id FROM families WHERE handle = 'F001'), (SELECT id FROM people WHERE handle = 'P004'), 2),
((SELECT id FROM families WHERE handle = 'F001'), (SELECT id FROM people WHERE handle = 'P005'), 3);
*/

-- ═══════════════════════════════════════════════════════════════════════════
-- Set first admin (replace with your email after signup)
-- ═══════════════════════════════════════════════════════════════════════════
-- UPDATE profiles SET role = 'admin' WHERE email = 'your-admin@example.com';
-- ═══════════════════════════════════════════════════════════════════════════
-- Sprint 6: Culture & Community Features Migration
-- Tables: achievements, fund_transactions, scholarships, clan_articles
-- Run this in Supabase SQL Editor after Sprint 5
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Achievements (Vinh danh thành tích)
CREATE TABLE achievements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id       UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    title           VARCHAR(255) NOT NULL,
    category        VARCHAR(50) NOT NULL CHECK (category IN ('hoc_tap', 'su_nghiep', 'cong_hien', 'other')),
    description     TEXT,
    year            INTEGER,
    awarded_by      VARCHAR(255),
    is_featured     BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_achievements_person ON achievements(person_id);
CREATE INDEX idx_achievements_category ON achievements(category);
CREATE INDEX idx_achievements_year ON achievements(year);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view achievements"
ON achievements FOR SELECT USING (true);

CREATE POLICY "Editors and admins can insert achievements"
ON achievements FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'editor')
  )
);

CREATE POLICY "Editors and admins can update achievements"
ON achievements FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'editor')
  )
);

CREATE POLICY "Admins can delete achievements"
ON achievements FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 2. Fund Transactions (Quỹ khuyến học)
CREATE TABLE fund_transactions (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type              VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    category          VARCHAR(50) NOT NULL CHECK (category IN ('dong_gop', 'hoc_bong', 'khen_thuong', 'other')),
    amount            DECIMAL(12, 0) NOT NULL CHECK (amount > 0),
    donor_name        VARCHAR(255),
    donor_person_id   UUID REFERENCES people(id) ON DELETE SET NULL,
    recipient_id      UUID REFERENCES people(id) ON DELETE SET NULL,
    description       TEXT,
    transaction_date  DATE NOT NULL DEFAULT CURRENT_DATE,
    academic_year     VARCHAR(20),
    created_by        UUID REFERENCES profiles(id),
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fund_tx_type ON fund_transactions(type);
CREATE INDEX idx_fund_tx_category ON fund_transactions(category);
CREATE INDEX idx_fund_tx_date ON fund_transactions(transaction_date);
CREATE INDEX idx_fund_tx_academic_year ON fund_transactions(academic_year);

ALTER TABLE fund_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view fund transactions"
ON fund_transactions FOR SELECT USING (true);

CREATE POLICY "Editors and admins can insert fund transactions"
ON fund_transactions FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'editor')
  )
);

CREATE POLICY "Editors and admins can update fund transactions"
ON fund_transactions FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'editor')
  )
);

CREATE POLICY "Admins can delete fund transactions"
ON fund_transactions FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 3. Scholarships (Học bổng & Khen thưởng)
CREATE TABLE scholarships (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id       UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    type            VARCHAR(20) NOT NULL CHECK (type IN ('hoc_bong', 'khen_thuong')),
    amount          DECIMAL(12, 0) NOT NULL CHECK (amount > 0),
    reason          TEXT,
    academic_year   VARCHAR(20) NOT NULL,
    school          VARCHAR(255),
    grade_level     VARCHAR(50),
    status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
    approved_by     UUID REFERENCES profiles(id),
    approved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scholarships_person ON scholarships(person_id);
CREATE INDEX idx_scholarships_type ON scholarships(type);
CREATE INDEX idx_scholarships_status ON scholarships(status);
CREATE INDEX idx_scholarships_year ON scholarships(academic_year);

ALTER TABLE scholarships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view scholarships"
ON scholarships FOR SELECT USING (true);

CREATE POLICY "Editors and admins can insert scholarships"
ON scholarships FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'editor')
  )
);

CREATE POLICY "Editors and admins can update scholarships"
ON scholarships FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'editor')
  )
);

CREATE POLICY "Admins can delete scholarships"
ON scholarships FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 4. Clan Articles (Hương ước)
CREATE TABLE clan_articles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(255) NOT NULL,
    content         TEXT NOT NULL,
    category        VARCHAR(50) NOT NULL CHECK (category IN ('gia_huan', 'quy_uoc', 'loi_dan')),
    sort_order      INTEGER DEFAULT 0,
    is_featured     BOOLEAN DEFAULT false,
    author_id       UUID REFERENCES profiles(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clan_articles_category ON clan_articles(category);
CREATE INDEX idx_clan_articles_sort ON clan_articles(sort_order);

ALTER TABLE clan_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view clan articles"
ON clan_articles FOR SELECT USING (true);

CREATE POLICY "Editors and admins can insert clan articles"
ON clan_articles FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'editor')
  )
);

CREATE POLICY "Editors and admins can update clan articles"
ON clan_articles FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'editor')
  )
);

CREATE POLICY "Admins can delete clan articles"
ON clan_articles FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- ═══════════════════════════════════════════════════════════════════════════
-- FR-906: Add Vietnamese cultural name fields to people table
-- pen_name = Tên tự (courtesy name), taboo_name = Tên húy (taboo name)
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE people ADD COLUMN IF NOT EXISTS pen_name VARCHAR(100);
ALTER TABLE people ADD COLUMN IF NOT EXISTS taboo_name VARCHAR(100);
-- ═══════════════════════════════════════════════════════════════════════════
-- Sprint 7: Lịch Cầu đương (Ceremony Rotation Schedule)
-- Phân công xoay vòng người chủ lễ Cầu đương theo thứ tự cây gia phả
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Nhóm cầu đương (rotation pool config)
--    Mỗi nhóm được định nghĩa bởi một tổ tông và tiêu chí đủ điều kiện
CREATE TABLE IF NOT EXISTS cau_duong_pools (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(200) NOT NULL,       -- VD: "Nhánh ông Đặng Đình Nhân"
    ancestor_id     UUID NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
    min_generation  INTEGER NOT NULL DEFAULT 1,  -- Đời tối thiểu (VD: 12)
    max_age_lunar   INTEGER NOT NULL DEFAULT 70, -- Tuổi âm tối đa (dưới 70)
    description     TEXT,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Phân công cầu đương (assignments)
--    Mỗi lễ trong năm được phân cho một người, xoay vòng theo thứ tự DFS
CREATE TABLE IF NOT EXISTS cau_duong_assignments (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_id                 UUID NOT NULL REFERENCES cau_duong_pools(id) ON DELETE CASCADE,
    year                    INTEGER NOT NULL,          -- Năm dương lịch
    ceremony_type           VARCHAR(30) NOT NULL CHECK (
                                ceremony_type IN ('tet', 'ram_thang_gieng', 'gio_to', 'ram_thang_bay')
                            ),
    -- Người được phân công (theo thứ tự xoay vòng)
    host_person_id          UUID REFERENCES people(id) ON DELETE SET NULL,
    -- Người thực sự thực hiện (nếu được ủy quyền)
    actual_host_person_id   UUID REFERENCES people(id) ON DELETE SET NULL,
    -- Trạng thái
    status                  VARCHAR(20) DEFAULT 'scheduled' CHECK (
                                status IN ('scheduled', 'completed', 'delegated', 'rescheduled', 'cancelled')
                            ),
    -- Ngày dự kiến (dương lịch, tính từ lịch âm)
    scheduled_date          DATE,
    -- Ngày thực hiện (nếu sớm/muộn hơn)
    actual_date             DATE,
    -- Lý do ủy quyền hoặc đổi ngày
    reason                  TEXT,
    notes                   TEXT,
    -- Thứ tự trong vòng xoay (để theo dõi tiến trình)
    rotation_index          INTEGER, -- Vị trí trong danh sách DFS khi phân công
    created_by              UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(pool_id, year, ceremony_type)
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_cau_duong_pools_ancestor ON cau_duong_pools(ancestor_id);
CREATE INDEX IF NOT EXISTS idx_cau_duong_assignments_pool ON cau_duong_assignments(pool_id);
CREATE INDEX IF NOT EXISTS idx_cau_duong_assignments_year ON cau_duong_assignments(year);
CREATE INDEX IF NOT EXISTS idx_cau_duong_assignments_host ON cau_duong_assignments(host_person_id);
CREATE INDEX IF NOT EXISTS idx_cau_duong_assignments_status ON cau_duong_assignments(status);

-- 4. RLS
ALTER TABLE cau_duong_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE cau_duong_assignments ENABLE ROW LEVEL SECURITY;

-- Pools: tất cả đọc được, admin/editor mới sửa được
CREATE POLICY "Anyone can view cau duong pools"
    ON cau_duong_pools FOR SELECT USING (true);

CREATE POLICY "Admins and editors can manage cau duong pools"
    ON cau_duong_pools FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role IN ('admin', 'editor')
        )
    );

-- Assignments: tất cả đọc được, admin/editor mới sửa được
CREATE POLICY "Anyone can view cau duong assignments"
    ON cau_duong_assignments FOR SELECT USING (true);

CREATE POLICY "Admins and editors can manage cau duong assignments"
    ON cau_duong_assignments FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role IN ('admin', 'editor')
        )
    );

-- ═══════════════════════════════════════════════════════════════════════════
-- Seed: Tạo nhóm cầu đương mặc định
-- Cập nhật ancestor_id sau khi đã chạy seed-dang-dinh.sql
-- ═══════════════════════════════════════════════════════════════════════════
-- INSERT INTO cau_duong_pools (name, ancestor_id, min_generation, max_age_lunar, description)
-- SELECT
--   'Nhóm Cầu đương Chi tộc Đặng Đình',
--   id,
--   12,   -- Đời 12 trở xuống
--   70,   -- Dưới 70 tuổi âm
--   'Xoay vòng các nam giới đã lập gia đình, dưới 70 tuổi âm, đời 12 trở xuống'
-- FROM people WHERE handle = 'P001'; -- Thay handle của tổ tông

-- ═══════════════════════════════════════════════════════════════════════════
-- Sprint 7.5 Migration: Tree-Scoped Editor
-- FR-507: Link user account to person in the family tree
-- FR-508: Scoped edit permissions (subtree boundary)
-- FR-510: Server-side enforcement via RLS + PostgreSQL function
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Add edit_root_person_id column to profiles
--    This stores the root of the subtree that this user can edit.
--    NULL = no restriction (global editor / not an editor at all).
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS edit_root_person_id UUID REFERENCES people(id) ON DELETE SET NULL;

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_linked_person     ON profiles(linked_person);
CREATE INDEX IF NOT EXISTS idx_profiles_edit_root_person  ON profiles(edit_root_person_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. PostgreSQL recursive function: is_person_in_subtree
--    Returns TRUE if target_id is the root or a descendant of root_id.
--    Uses recursive CTE through families + children tables.
--    SECURITY DEFINER: runs as owner, bypasses RLS on the read path.
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION is_person_in_subtree(root_id UUID, target_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  WITH RECURSIVE subtree(id) AS (
    -- Base case: the root itself
    SELECT root_id
    UNION
    -- Recursive case: children via families + children junction
    SELECT ch.person_id
    FROM   subtree s
    JOIN   families f  ON (f.father_id = s.id OR f.mother_id = s.id)
    JOIN   children ch ON ch.family_id = f.id
  )
  SELECT EXISTS (SELECT 1 FROM subtree WHERE id = target_id);
$$;

-- Grant execute to authenticated users (needed for RLS policy evaluation)
GRANT EXECUTE ON FUNCTION is_person_in_subtree(UUID, UUID) TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. RLS: Linked person can update their own record (FR-507)
--    A user whose profile.linked_person = people.id can update their own info,
--    even if they have viewer role. This enables self-service profile updates.
-- ═══════════════════════════════════════════════════════════════════════════
CREATE POLICY "Linked person can update own info" ON people
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE  p.user_id = auth.uid()
      AND    p.linked_person = people.id
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. RLS: Branch editors can update people within their assigned subtree (FR-508)
--    Supplements (OR) the existing global editor policy.
--    Only activates when edit_root_person_id IS NOT NULL.
-- ═══════════════════════════════════════════════════════════════════════════
CREATE POLICY "Branch editors can update their subtree" ON people
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE  p.user_id = auth.uid()
      AND    p.role = 'editor'
      AND    p.edit_root_person_id IS NOT NULL
      AND    is_person_in_subtree(p.edit_root_person_id, people.id)
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. RLS: Branch editors can insert people (children in their subtree)
--    INSERT doesn't have the new person's ID yet, so we allow all editors
--    to insert — consistent with current behaviour.
--    Subtree enforcement for INSERT is handled at application level.
-- ═══════════════════════════════════════════════════════════════════════════
-- (No change: existing "Admins and editors can insert people" policy covers this)
-- ═══════════════════════════════════════════════════════════════════════════
-- Supabase Storage Setup for AncestorTree
-- Run this in Supabase SQL Editor or Dashboard → Storage
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Create the 'media' storage bucket (public access for reading)
-- Note: This is typically done via Supabase Dashboard → Storage → New Bucket
-- Settings:
--   Name: media
--   Public: true
--   File size limit: 5MB (5242880 bytes)
--   Allowed MIME types: image/jpeg, image/png, image/webp, image/gif

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
