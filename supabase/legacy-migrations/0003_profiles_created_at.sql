-- ============================================================
-- 0003_profiles_created_at.sql
-- Bổ sung cột created_at vào profiles (thiếu trong 0001)
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();