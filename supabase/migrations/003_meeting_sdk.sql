-- Migration: Switch from Zoom Video SDK (session names) to Zoom Meeting SDK (meeting IDs)

ALTER TABLE meetings
  ADD COLUMN IF NOT EXISTS zoom_meeting_id       bigint,
  ADD COLUMN IF NOT EXISTS zoom_meeting_password text NOT NULL DEFAULT '';

-- Optional: keep zoom_session_name column for reference but stop using it
-- DROP COLUMN zoom_session_name; -- uncomment if you want to clean it up
