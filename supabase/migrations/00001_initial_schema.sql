-- AllVideo.one Database Schema
-- Run this in Supabase SQL Editor

-- Enable extensions (in extensions schema for Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- Enums
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE video_status AS ENUM ('uploading', 'processing', 'ready', 'failed', 'deleted');
CREATE TYPE transcode_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE subscription_tier AS ENUM ('free', 'starter', 'pro', 'business');

-- ============================================
-- USERS (extends auth.users)
-- ============================================
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'user',
  -- Storage limits (in bytes)
  storage_limit_bytes BIGINT DEFAULT 10737418240, -- 10GB free
  storage_used_bytes BIGINT DEFAULT 0,
  -- Bandwidth (monthly reset)
  bandwidth_limit_bytes BIGINT DEFAULT 107374182400, -- 100GB/month free
  bandwidth_used_bytes BIGINT DEFAULT 0,
  bandwidth_reset_at TIMESTAMPTZ DEFAULT (date_trunc('month', now()) + interval '1 month'),
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- SUBSCRIPTIONS
-- ============================================
CREATE TABLE public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  -- Plan details
  tier subscription_tier DEFAULT 'free',
  storage_limit_gb INT DEFAULT 10,
  bandwidth_limit_gb INT DEFAULT 100,
  -- Dates
  starts_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  -- Meta
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_active ON public.subscriptions(user_id, is_active) WHERE is_active = true;

-- ============================================
-- VIDEOS
-- ============================================
CREATE TABLE public.videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  -- Basic info
  title TEXT NOT NULL,
  description TEXT,
  -- Source file (uploaded original)
  original_key TEXT,
  original_size_bytes BIGINT DEFAULT 0,
  original_filename TEXT,
  mime_type TEXT,
  -- Processed (HLS output)
  hls_key TEXT,
  thumbnail_key TEXT,
  -- Video metadata (from FFmpeg)
  duration_seconds NUMERIC(10,2),
  width INT,
  height INT,
  -- Status
  status video_status DEFAULT 'uploading',
  error_message TEXT,
  -- Analytics
  views_count BIGINT DEFAULT 0,
  -- Settings
  is_public BOOLEAN DEFAULT false,
  -- Timestamps
  uploaded_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_videos_user ON public.videos(user_id);
CREATE INDEX idx_videos_status ON public.videos(user_id, status);
CREATE INDEX idx_videos_created ON public.videos(user_id, created_at DESC);

-- ============================================
-- TRANSCODE JOBS (Queue for VPS worker)
-- ============================================
CREATE TABLE public.transcode_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
  -- Job info
  status transcode_status DEFAULT 'pending',
  priority INT DEFAULT 0,
  -- Progress
  progress INT DEFAULT 0,
  current_step TEXT,
  -- Worker
  worker_id TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  -- Error handling
  error_message TEXT,
  retry_count INT DEFAULT 0,
  max_retries INT DEFAULT 3,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_jobs_pending ON public.transcode_jobs(status, priority DESC, created_at)
  WHERE status = 'pending';
CREATE INDEX idx_jobs_video ON public.transcode_jobs(video_id);

-- ============================================
-- API KEYS
-- ============================================
CREATE TABLE public.api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  -- Key details
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  -- Permissions
  permissions JSONB DEFAULT '{"read": true, "write": false, "delete": false}'::jsonb,
  -- Limits
  rate_limit_per_minute INT DEFAULT 60,
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_api_keys_user ON public.api_keys(user_id);
CREATE INDEX idx_api_keys_hash ON public.api_keys(key_hash) WHERE is_active = true;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );

  -- Create free subscription
  INSERT INTO public.subscriptions (user_id, tier, storage_limit_gb, bandwidth_limit_gb)
  VALUES (NEW.id, 'free', 10, 100);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update storage used
CREATE OR REPLACE FUNCTION update_user_storage()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.users
    SET storage_used_bytes = (
      SELECT COALESCE(SUM(original_size_bytes), 0)
      FROM public.videos
      WHERE user_id = NEW.user_id AND status != 'deleted'
    ),
    updated_at = now()
    WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.users
    SET storage_used_bytes = (
      SELECT COALESCE(SUM(original_size_bytes), 0)
      FROM public.videos
      WHERE user_id = OLD.user_id AND status != 'deleted'
    ),
    updated_at = now()
    WHERE id = OLD.user_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_storage
  AFTER INSERT OR UPDATE OR DELETE ON public.videos
  FOR EACH ROW EXECUTE FUNCTION update_user_storage();

-- Claim next transcode job (for worker)
CREATE OR REPLACE FUNCTION claim_transcode_job(worker_name TEXT)
RETURNS TABLE (
  job_id UUID,
  video_id UUID,
  original_key TEXT,
  user_id UUID
) AS $$
DECLARE
  claimed_job RECORD;
BEGIN
  UPDATE public.transcode_jobs
  SET
    status = 'processing',
    worker_id = worker_name,
    started_at = now(),
    updated_at = now()
  WHERE id = (
    SELECT id FROM public.transcode_jobs
    WHERE status = 'pending' AND retry_count < max_retries
    ORDER BY priority DESC, created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING id, transcode_jobs.video_id INTO claimed_job;

  IF claimed_job IS NOT NULL THEN
    RETURN QUERY
    SELECT
      claimed_job.id,
      claimed_job.video_id,
      v.original_key,
      v.user_id
    FROM public.videos v
    WHERE v.id = claimed_job.video_id;
  END IF;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcode_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Note: Admin policies removed to avoid infinite recursion
-- Admin access should be handled via service role key or separate admin schema

-- Allow public to view basic user profiles (for channel pages)
CREATE POLICY "Public can view user profiles"
  ON public.users FOR SELECT
  USING (true);

-- Videos policies
CREATE POLICY "Users can view own videos"
  ON public.videos FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own videos"
  ON public.videos FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own videos"
  ON public.videos FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own videos"
  ON public.videos FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all videos"
  ON public.videos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Subscriptions policies
CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage subscriptions"
  ON public.subscriptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- API Keys policies
CREATE POLICY "Users can manage own API keys"
  ON public.api_keys FOR ALL
  USING (user_id = auth.uid());

-- Transcode Jobs policies
CREATE POLICY "Users can view own jobs"
  ON public.transcode_jobs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.videos
      WHERE id = video_id AND user_id = auth.uid()
    )
  );
