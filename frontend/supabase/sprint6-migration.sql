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
    category        VARCHAR(50) NOT NULL CHECK (category IN ('gioi_thieu', 'gia_huan', 'quy_uoc', 'loi_dan')),
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
