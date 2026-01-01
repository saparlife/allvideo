-- Migration 00007: Search History and Additional Features
-- Adds search history, scheduled publishing, featured videos, and other missing features

-- ============================================
-- 1. SEARCH HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  query VARCHAR(255) NOT NULL,
  searched_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, query)
);

CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id, searched_at DESC);

-- RLS for search history
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own search history" ON search_history;
CREATE POLICY "Users can manage own search history" ON search_history
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 2. SCHEDULED PUBLISHING
-- ============================================
ALTER TABLE videos ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS is_premiere BOOLEAN DEFAULT false;

-- Index for scheduled videos
CREATE INDEX IF NOT EXISTS idx_videos_scheduled ON videos(scheduled_at)
  WHERE scheduled_at IS NOT NULL AND status = 'ready';

-- ============================================
-- 3. FEATURED VIDEO ON CHANNEL
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS featured_video_id UUID REFERENCES videos(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS channel_trailer_id UUID REFERENCES videos(id) ON DELETE SET NULL;

-- ============================================
-- 4. SUBCATEGORIES
-- ============================================
ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);

-- ============================================
-- 5. LIKE MILESTONES NOTIFICATIONS
-- ============================================
-- Add milestone tracking to videos
ALTER TABLE videos ADD COLUMN IF NOT EXISTS last_like_milestone INTEGER DEFAULT 0;

-- ============================================
-- 6. PLAYLIST IMPROVEMENTS
-- ============================================
ALTER TABLE playlists ADD COLUMN IF NOT EXISTS auto_add_uploads BOOLEAN DEFAULT false;

-- ============================================
-- 7. CONTENT POLICIES ACKNOWLEDGMENT
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS policies_accepted_at TIMESTAMPTZ;

-- ============================================
-- 8. SHORTS SUPPORT
-- ============================================
ALTER TABLE videos ADD COLUMN IF NOT EXISTS is_short BOOLEAN DEFAULT false;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS aspect_ratio VARCHAR(10);

CREATE INDEX IF NOT EXISTS idx_videos_shorts ON videos(is_short, created_at DESC)
  WHERE is_short = true AND status = 'ready';

-- ============================================
-- 9. LIVE STREAMING SUPPORT
-- ============================================
CREATE TABLE IF NOT EXISTS streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  thumbnail_key VARCHAR(500),
  category_id UUID REFERENCES categories(id),

  -- Stream keys
  stream_key VARCHAR(100) UNIQUE NOT NULL,
  playback_id VARCHAR(100),

  -- Status
  status VARCHAR(20) DEFAULT 'offline', -- offline, starting, live, ended
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,

  -- Stats
  peak_viewers INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,

  -- Settings
  visibility VARCHAR(20) DEFAULT 'public',
  chat_enabled BOOLEAN DEFAULT true,
  chat_slow_mode INTEGER DEFAULT 0, -- seconds between messages, 0 = disabled

  -- Recording
  record_stream BOOLEAN DEFAULT true,
  recording_video_id UUID REFERENCES videos(id),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_streams_user ON streams(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_streams_status ON streams(status) WHERE status = 'live';

-- Stream chat messages
CREATE TABLE IF NOT EXISTS stream_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content VARCHAR(500) NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stream_messages ON stream_messages(stream_id, created_at);

-- RLS for streams
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own streams" ON streams;
CREATE POLICY "Users can manage own streams" ON streams
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public can view live streams" ON streams;
CREATE POLICY "Public can view live streams" ON streams
  FOR SELECT USING (visibility = 'public' OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can send chat messages" ON stream_messages;
CREATE POLICY "Users can send chat messages" ON stream_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view chat messages" ON stream_messages;
CREATE POLICY "Anyone can view chat messages" ON stream_messages
  FOR SELECT USING (NOT is_deleted);

-- ============================================
-- 10. FUNCTION TO PUBLISH SCHEDULED VIDEOS
-- ============================================
CREATE OR REPLACE FUNCTION publish_scheduled_videos()
RETURNS void AS $$
BEGIN
  UPDATE videos
  SET visibility = 'public',
      scheduled_at = NULL
  WHERE scheduled_at IS NOT NULL
    AND scheduled_at <= now()
    AND status = 'ready'
    AND visibility != 'public';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
