-- =============================================
-- RecoveryCircle: Certification Levels
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. Add certification_level to profiles (0 = not certified, 1-5 = levels)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS certification_level int NOT NULL DEFAULT 0;

-- 2. Level-up requests table
CREATE TABLE IF NOT EXISTS level_requests (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  guide_id      uuid        REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  meeting_id    uuid        REFERENCES meetings(id) ON DELETE SET NULL,
  requested_by  uuid        REFERENCES profiles(id),
  processed_by  uuid        REFERENCES profiles(id),
  status        text        NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  processed_at  timestamptz,
  created_at    timestamptz DEFAULT now(),
  UNIQUE(meeting_id)  -- one request per meeting
);

CREATE INDEX IF NOT EXISTS idx_level_req_guide  ON level_requests(guide_id);
CREATE INDEX IF NOT EXISTS idx_level_req_status ON level_requests(status);

-- 3. RLS
ALTER TABLE level_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "level_req_read" ON level_requests FOR SELECT
  USING (
    guide_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin'))
  );

CREATE POLICY "level_req_write" ON level_requests FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','superadmin'))
  );
