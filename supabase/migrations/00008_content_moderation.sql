-- Migration 00008: Content Moderation
-- Adds reports table, user bans, and moderation features

-- ============================================
-- 1. CONTENT REPORTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- What is being reported
  content_type VARCHAR(20) NOT NULL, -- 'video', 'comment', 'user'
  content_id UUID NOT NULL,

  -- Report details
  reason VARCHAR(50) NOT NULL, -- 'spam', 'harassment', 'hate', 'violence', 'sexual', 'copyright', 'other'
  description TEXT,

  -- Moderation status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'reviewed', 'action_taken', 'dismissed'
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  action_taken VARCHAR(100),

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON content_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_content ON content_reports(content_type, content_id);

-- ============================================
-- 2. USER BANS
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_by UUID REFERENCES users(id);

-- ============================================
-- 3. VIDEO MODERATION FLAGS
-- ============================================
ALTER TABLE videos ADD COLUMN IF NOT EXISTS is_removed BOOLEAN DEFAULT false;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS removed_at TIMESTAMPTZ;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS removed_reason TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS removed_by UUID REFERENCES users(id);

-- ============================================
-- 4. COMMENT MODERATION
-- ============================================
ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS hidden_by UUID REFERENCES users(id);
ALTER TABLE comments ADD COLUMN IF NOT EXISTS hidden_reason TEXT;

-- ============================================
-- 5. ADMIN ACTION LOG
-- ============================================
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL, -- 'ban_user', 'unban_user', 'remove_video', 'restore_video', 'hide_comment', etc.
  target_type VARCHAR(20) NOT NULL, -- 'user', 'video', 'comment'
  target_id UUID NOT NULL,
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_actions ON admin_actions(created_at DESC);

-- ============================================
-- 6. RLS POLICIES
-- ============================================
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- Users can create reports
DROP POLICY IF EXISTS "Users can create reports" ON content_reports;
CREATE POLICY "Users can create reports" ON content_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Admins can view and manage all reports
DROP POLICY IF EXISTS "Admins can manage reports" ON content_reports;
CREATE POLICY "Admins can manage reports" ON content_reports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Admin actions are admin-only
DROP POLICY IF EXISTS "Admins can manage action logs" ON admin_actions;
CREATE POLICY "Admins can manage action logs" ON admin_actions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
