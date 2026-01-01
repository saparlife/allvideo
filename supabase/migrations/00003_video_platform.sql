-- ============================================
-- UnlimVideo Platform Migration
-- Transform from B2B hosting to B2C platform
-- ============================================

-- ============================================
-- 1. CATEGORIES
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  name_ru VARCHAR(100),
  slug VARCHAR(100) UNIQUE NOT NULL,
  icon VARCHAR(50),
  color VARCHAR(7) DEFAULT '#6366f1',
  video_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default categories
INSERT INTO categories (name, name_ru, slug, icon, color, sort_order) VALUES
  ('Gaming', 'Игры', 'gaming', 'gamepad-2', '#ef4444', 1),
  ('Music', 'Музыка', 'music', 'music', '#f97316', 2),
  ('Education', 'Образование', 'education', 'graduation-cap', '#eab308', 3),
  ('Entertainment', 'Развлечения', 'entertainment', 'party-popper', '#22c55e', 4),
  ('Sports', 'Спорт', 'sports', 'trophy', '#14b8a6', 5),
  ('News', 'Новости', 'news', 'newspaper', '#06b6d4', 6),
  ('Technology', 'Технологии', 'technology', 'cpu', '#3b82f6', 7),
  ('Travel', 'Путешествия', 'travel', 'plane', '#8b5cf6', 8),
  ('Food', 'Еда', 'food', 'utensils', '#ec4899', 9),
  ('Lifestyle', 'Стиль жизни', 'lifestyle', 'heart', '#f43f5e', 10),
  ('Science', 'Наука', 'science', 'flask-conical', '#6366f1', 11),
  ('Business', 'Бизнес', 'business', 'briefcase', '#71717a', 12)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 2. EXTEND USERS TABLE (Channels)
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS channel_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS channel_description TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS banner_url VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscribers_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_views BIGINT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_videos INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS language VARCHAR(5) DEFAULT 'en';
ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_channel_public BOOLEAN DEFAULT true;

-- ============================================
-- 3. EXTEND VIDEOS TABLE
-- ============================================
ALTER TABLE videos ADD COLUMN IF NOT EXISTS slug VARCHAR(255);
ALTER TABLE videos ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id);
ALTER TABLE videos ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE videos ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS is_unlisted BOOLEAN DEFAULT false;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS dislikes_count INTEGER DEFAULT 0;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS language VARCHAR(5) DEFAULT 'en';
ALTER TABLE videos ADD COLUMN IF NOT EXISTS has_captions BOOLEAN DEFAULT false;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS has_transcript BOOLEAN DEFAULT false;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS transcript_search tsvector;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS allow_comments BOOLEAN DEFAULT true;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS allow_embedding BOOLEAN DEFAULT true;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS age_restricted BOOLEAN DEFAULT false;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS duration INTEGER;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR(500);
ALTER TABLE videos ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'public';

-- Create unique slug index
CREATE UNIQUE INDEX IF NOT EXISTS idx_videos_slug ON videos(slug) WHERE slug IS NOT NULL;

-- Create full-text search index
CREATE INDEX IF NOT EXISTS idx_videos_search ON videos USING gin(
  to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, ''))
);

-- Create transcript search index
CREATE INDEX IF NOT EXISTS idx_videos_transcript_search ON videos USING gin(transcript_search);

-- ============================================
-- 4. LIKES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  is_like BOOLEAN NOT NULL, -- true = like, false = dislike
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, video_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_video ON likes(video_id);
CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id);

-- ============================================
-- 5. COMMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  is_hearted BOOLEAN DEFAULT false, -- creator liked this comment
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_video ON comments(video_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);

-- ============================================
-- 6. COMMENT LIKES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, comment_id)
);

-- ============================================
-- 7. CHANNEL SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS channel_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(subscriber_id, channel_id),
  CHECK (subscriber_id != channel_id)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_subscriber ON channel_subscriptions(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_channel ON channel_subscriptions(channel_id);

-- ============================================
-- 8. WATCH HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS watch_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  progress_seconds INTEGER DEFAULT 0,
  progress_percent SMALLINT DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  watch_count INTEGER DEFAULT 1,
  first_watched_at TIMESTAMPTZ DEFAULT now(),
  last_watched_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, video_id)
);

CREATE INDEX IF NOT EXISTS idx_watch_history_user ON watch_history(user_id, last_watched_at DESC);

-- ============================================
-- 9. WATCH LATER TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS watch_later (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, video_id)
);

-- ============================================
-- 10. PLAYLISTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  thumbnail_url VARCHAR(500),
  is_public BOOLEAN DEFAULT true,
  video_count INTEGER DEFAULT 0,
  total_duration_seconds INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_playlists_user ON playlists(user_id);

-- ============================================
-- 11. PLAYLIST VIDEOS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS playlist_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(playlist_id, video_id)
);

CREATE INDEX IF NOT EXISTS idx_playlist_videos_playlist ON playlist_videos(playlist_id, position);

-- ============================================
-- 12. VIDEO CAPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS video_captions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  language VARCHAR(10) NOT NULL,
  label VARCHAR(100), -- e.g., "English (auto-generated)"
  is_auto_generated BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,
  vtt_key VARCHAR(500), -- R2 key for VTT file
  srt_key VARCHAR(500), -- R2 key for SRT file
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(video_id, language)
);

CREATE INDEX IF NOT EXISTS idx_video_captions_video ON video_captions(video_id);

-- ============================================
-- 13. VIDEO TRANSCRIPTS TABLE (AI-generated)
-- ============================================
CREATE TABLE IF NOT EXISTS video_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  language VARCHAR(10) NOT NULL DEFAULT 'en',
  segments JSONB NOT NULL DEFAULT '[]', -- [{start: 0.5, end: 2.3, text: "Hello"}]
  full_text TEXT, -- Full transcript for search
  word_count INTEGER DEFAULT 0,
  confidence REAL, -- Average confidence score
  model VARCHAR(50), -- e.g., "whisper-1"
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(video_id, language)
);

CREATE INDEX IF NOT EXISTS idx_video_transcripts_video ON video_transcripts(video_id);
CREATE INDEX IF NOT EXISTS idx_video_transcripts_fulltext ON video_transcripts USING gin(to_tsvector('english', full_text));

-- ============================================
-- 14. VIDEO AUDIO TRACKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS video_audio_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  language VARCHAR(10) NOT NULL,
  label VARCHAR(100),
  is_original BOOLEAN DEFAULT false,
  is_ai_generated BOOLEAN DEFAULT false,
  audio_key VARCHAR(500), -- R2 key
  hls_key VARCHAR(500), -- HLS manifest with this audio
  voice_id VARCHAR(100), -- ElevenLabs voice ID if AI
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(video_id, language)
);

-- ============================================
-- 15. REPORTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id),
  video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
  comment_id UUID REFERENCES comments(id) ON DELETE SET NULL,
  channel_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reason VARCHAR(50) NOT NULL, -- spam, harassment, copyright, etc.
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- pending, reviewed, resolved, dismissed
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- ============================================
-- 16. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- new_video, comment, like, subscribe, reply
  title VARCHAR(255),
  message TEXT,
  data JSONB DEFAULT '{}', -- {video_id, comment_id, etc.}
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- ============================================
-- 17. TRENDING CACHE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS trending_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  score REAL NOT NULL,
  period VARCHAR(20) NOT NULL, -- daily, weekly, monthly
  rank INTEGER NOT NULL,
  calculated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(video_id, period)
);

CREATE INDEX IF NOT EXISTS idx_trending_period ON trending_videos(period, rank);

-- ============================================
-- 18. VIDEO ANALYTICS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS video_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  unique_viewers INTEGER DEFAULT 0,
  watch_time_seconds BIGINT DEFAULT 0,
  avg_view_duration_seconds INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  dislikes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  subscribers_gained INTEGER DEFAULT 0,
  subscribers_lost INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  click_through_rate REAL DEFAULT 0,
  UNIQUE(video_id, date)
);

CREATE INDEX IF NOT EXISTS idx_video_analytics_video ON video_analytics(video_id, date DESC);

-- ============================================
-- 19. RLS POLICIES
-- ============================================

-- Categories: public read
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
CREATE POLICY "Anyone can view categories" ON categories FOR SELECT USING (true);

-- Likes: users can manage own, public can view counts
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own likes" ON likes;
CREATE POLICY "Users can manage own likes" ON likes FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Public can view likes" ON likes;
CREATE POLICY "Public can view likes" ON likes FOR SELECT USING (true);

-- Comments: public can view, users can manage own
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view non-deleted comments" ON comments;
CREATE POLICY "Public can view non-deleted comments" ON comments FOR SELECT USING (is_deleted = false);
DROP POLICY IF EXISTS "Users can insert comments" ON comments;
CREATE POLICY "Users can insert comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (auth.uid() = user_id);

-- Subscriptions
ALTER TABLE channel_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own subscriptions" ON channel_subscriptions;
CREATE POLICY "Users can manage own subscriptions" ON channel_subscriptions FOR ALL USING (auth.uid() = subscriber_id);
DROP POLICY IF EXISTS "Public can view subscription counts" ON channel_subscriptions;
CREATE POLICY "Public can view subscription counts" ON channel_subscriptions FOR SELECT USING (true);

-- Watch history: private
ALTER TABLE watch_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own watch history" ON watch_history;
CREATE POLICY "Users can manage own watch history" ON watch_history FOR ALL USING (auth.uid() = user_id);

-- Watch later: private
ALTER TABLE watch_later ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own watch later" ON watch_later;
CREATE POLICY "Users can manage own watch later" ON watch_later FOR ALL USING (auth.uid() = user_id);

-- Playlists: public can view public, users can manage own
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view public playlists" ON playlists;
CREATE POLICY "Public can view public playlists" ON playlists FOR SELECT USING (is_public = true OR auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage own playlists" ON playlists;
CREATE POLICY "Users can manage own playlists" ON playlists FOR ALL USING (auth.uid() = user_id);

-- Captions: public read
ALTER TABLE video_captions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view captions" ON video_captions;
CREATE POLICY "Public can view captions" ON video_captions FOR SELECT USING (true);

-- Transcripts: public read
ALTER TABLE video_transcripts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view transcripts" ON video_transcripts;
CREATE POLICY "Public can view transcripts" ON video_transcripts FOR SELECT USING (true);

-- Notifications: private
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own notifications" ON notifications;
CREATE POLICY "Users can manage own notifications" ON notifications FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 20. FUNCTIONS
-- ============================================

-- Function to generate unique video slug
CREATE OR REPLACE FUNCTION generate_video_slug(title TEXT, video_id UUID)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Create base slug from title
  base_slug := lower(regexp_replace(title, '[^a-zA-Z0-9\s]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := substring(base_slug, 1, 50);

  -- Add video ID suffix for uniqueness
  final_slug := base_slug || '-' || substring(video_id::text, 1, 8);

  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to update video stats
CREATE OR REPLACE FUNCTION update_video_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'likes' THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.is_like THEN
        UPDATE videos SET likes_count = likes_count + 1 WHERE id = NEW.video_id;
      ELSE
        UPDATE videos SET dislikes_count = dislikes_count + 1 WHERE id = NEW.video_id;
      END IF;
    ELSIF TG_OP = 'DELETE' THEN
      IF OLD.is_like THEN
        UPDATE videos SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.video_id;
      ELSE
        UPDATE videos SET dislikes_count = GREATEST(0, dislikes_count - 1) WHERE id = OLD.video_id;
      END IF;
    ELSIF TG_OP = 'UPDATE' THEN
      IF OLD.is_like AND NOT NEW.is_like THEN
        UPDATE videos SET likes_count = GREATEST(0, likes_count - 1), dislikes_count = dislikes_count + 1 WHERE id = NEW.video_id;
      ELSIF NOT OLD.is_like AND NEW.is_like THEN
        UPDATE videos SET dislikes_count = GREATEST(0, dislikes_count - 1), likes_count = likes_count + 1 WHERE id = NEW.video_id;
      END IF;
    END IF;
  ELSIF TG_TABLE_NAME = 'comments' THEN
    IF TG_OP = 'INSERT' AND NEW.parent_id IS NULL THEN
      UPDATE videos SET comments_count = comments_count + 1 WHERE id = NEW.video_id;
    ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NULL THEN
      UPDATE videos SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.video_id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for likes
DROP TRIGGER IF EXISTS trigger_update_video_likes ON likes;
CREATE TRIGGER trigger_update_video_likes
  AFTER INSERT OR UPDATE OR DELETE ON likes
  FOR EACH ROW EXECUTE FUNCTION update_video_stats();

-- Trigger for comments
DROP TRIGGER IF EXISTS trigger_update_video_comments ON comments;
CREATE TRIGGER trigger_update_video_comments
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_video_stats();

-- Function to update subscriber count
CREATE OR REPLACE FUNCTION update_subscriber_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE users SET subscribers_count = subscribers_count + 1 WHERE id = NEW.channel_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE users SET subscribers_count = GREATEST(0, subscribers_count - 1) WHERE id = OLD.channel_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_subscriber_count ON channel_subscriptions;
CREATE TRIGGER trigger_update_subscriber_count
  AFTER INSERT OR DELETE ON channel_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_subscriber_count();

-- Function to update category video count
CREATE OR REPLACE FUNCTION update_category_video_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.category_id IS NOT NULL AND NEW.status = 'ready' AND NEW.is_public = true THEN
    UPDATE categories SET video_count = video_count + 1 WHERE id = NEW.category_id;
  ELSIF TG_OP = 'DELETE' AND OLD.category_id IS NOT NULL AND OLD.status = 'ready' AND OLD.is_public = true THEN
    UPDATE categories SET video_count = GREATEST(0, video_count - 1) WHERE id = OLD.category_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle category change
    IF OLD.category_id IS DISTINCT FROM NEW.category_id THEN
      IF OLD.category_id IS NOT NULL AND OLD.status = 'ready' AND OLD.is_public = true THEN
        UPDATE categories SET video_count = GREATEST(0, video_count - 1) WHERE id = OLD.category_id;
      END IF;
      IF NEW.category_id IS NOT NULL AND NEW.status = 'ready' AND NEW.is_public = true THEN
        UPDATE categories SET video_count = video_count + 1 WHERE id = NEW.category_id;
      END IF;
    END IF;
    -- Handle visibility change
    IF OLD.is_public = true AND NEW.is_public = false AND NEW.category_id IS NOT NULL THEN
      UPDATE categories SET video_count = GREATEST(0, video_count - 1) WHERE id = NEW.category_id;
    ELSIF OLD.is_public = false AND NEW.is_public = true AND NEW.category_id IS NOT NULL THEN
      UPDATE categories SET video_count = video_count + 1 WHERE id = NEW.category_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_category_count ON videos;
CREATE TRIGGER trigger_update_category_count
  AFTER INSERT OR UPDATE OR DELETE ON videos
  FOR EACH ROW EXECUTE FUNCTION update_category_video_count();

-- Function to search transcripts
CREATE OR REPLACE FUNCTION search_transcript(video_uuid UUID, search_query TEXT)
RETURNS TABLE(segment_start REAL, segment_end REAL, segment_text TEXT, relevance REAL) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (segment->>'start')::REAL,
    (segment->>'end')::REAL,
    segment->>'text',
    ts_rank(to_tsvector('english', segment->>'text'), plainto_tsquery('english', search_query)) as relevance
  FROM video_transcripts vt,
       jsonb_array_elements(vt.segments) as segment
  WHERE vt.video_id = video_uuid
    AND to_tsvector('english', segment->>'text') @@ plainto_tsquery('english', search_query)
  ORDER BY relevance DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 21. UPDATE VIDEOS RLS FOR PUBLIC ACCESS
-- ============================================

-- Drop existing policy if exists
DROP POLICY IF EXISTS "Public can view ready videos" ON videos;;
CREATE POLICY "Public can view ready videos" ON videos;
DROP POLICY IF EXISTS "Public can view public ready videos" ON videos;;
CREATE POLICY "Public can view public ready videos" ON videos;

-- Create new policy for public videos
DROP POLICY IF EXISTS "Public can view public ready videos" ON videos;
CREATE POLICY "Public can view public ready videos" ON videos
FOR SELECT
USING (
  status = 'ready'
  AND is_public = true
  AND (scheduled_at IS NULL OR scheduled_at <= now())
);

-- Policy for unlisted videos (anyone with link)
DROP POLICY IF EXISTS "Anyone can view unlisted videos" ON videos;
CREATE POLICY "Anyone can view unlisted videos" ON videos
FOR SELECT
USING (
  status = 'ready'
  AND is_unlisted = true
);
