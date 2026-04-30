-- =============================================
-- RecoveryCircle: Meetings & Rewards Migration
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. MEETINGS
CREATE TABLE IF NOT EXISTS meetings (
  id                 uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  title              text        NOT NULL,
  description        text,
  host_id            uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  type               text        NOT NULL DEFAULT 'general', -- general | certification
  status             text        NOT NULL DEFAULT 'upcoming', -- upcoming | live | ended | cancelled
  date               timestamptz NOT NULL,
  duration_minutes   int         NOT NULL DEFAULT 60,
  zoom_session_name  text        NOT NULL UNIQUE,
  max_participants   int         NOT NULL DEFAULT 50,
  karma_cost         int         NOT NULL DEFAULT 2,
  created_by         uuid        REFERENCES profiles(id),
  created_at         timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meetings_host     ON meetings(host_id);
CREATE INDEX IF NOT EXISTS idx_meetings_status   ON meetings(status);
CREATE INDEX IF NOT EXISTS idx_meetings_date     ON meetings(date);

-- 2. MEETING REGISTRATIONS
CREATE TABLE IF NOT EXISTS meeting_registrations (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id  uuid        REFERENCES meetings(id) ON DELETE CASCADE NOT NULL,
  user_id     uuid        REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  karma_spent int         NOT NULL DEFAULT 2,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(meeting_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_meeting_reg_meeting ON meeting_registrations(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_reg_user    ON meeting_registrations(user_id);

-- 3. WALLET TRANSACTIONS (credit/debit log)
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid        REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount       int         NOT NULL,            -- positive = credit, negative = debit
  type         text        NOT NULL,            -- credit | debit
  source       text        NOT NULL,            -- stripe | meeting_registration | admin_reward | store_purchase
  reference_id text,
  description  text,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallet_user ON wallet_transactions(user_id);

-- 4. KARMA REWARDS (admin manually awarding KC)
CREATE TABLE IF NOT EXISTS karma_rewards (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  giver_id     uuid        REFERENCES profiles(id),
  receiver_id  uuid        REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  meeting_id   uuid        REFERENCES meetings(id) ON DELETE SET NULL,
  amount       int         NOT NULL CHECK (amount > 0),
  reason       text,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_karma_rewards_receiver ON karma_rewards(receiver_id);

-- =============================================
-- Row Level Security (RLS)
-- =============================================

ALTER TABLE meetings              ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE karma_rewards         ENABLE ROW LEVEL SECURITY;

-- Meetings: everyone can read, admin/superadmin can write
CREATE POLICY "meetings_read_all"  ON meetings FOR SELECT USING (true);
CREATE POLICY "meetings_admin_write" ON meetings FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin')
  ));

-- Registrations: user sees own, admin sees all
CREATE POLICY "reg_select_own" ON meeting_registrations FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin','guide')
  ));
CREATE POLICY "reg_insert_own" ON meeting_registrations FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "reg_delete_own" ON meeting_registrations FOR DELETE
  USING (user_id = auth.uid());

-- Wallet: user sees own, admin sees all
CREATE POLICY "wallet_own" ON wallet_transactions FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin')
  ));

-- Karma rewards: admin writes, everyone can see their own received
CREATE POLICY "karma_rewards_own"  ON karma_rewards FOR SELECT
  USING (receiver_id = auth.uid() OR giver_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin')
  ));
CREATE POLICY "karma_rewards_admin" ON karma_rewards FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin')
  ));
