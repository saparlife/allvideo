-- 1stream.dev Migration: Add custom_metadata support
-- This allows users to attach arbitrary data to their uploads (companyId, userId, etc.)

-- Add custom_metadata to videos table
ALTER TABLE public.videos
ADD COLUMN IF NOT EXISTS custom_metadata JSONB DEFAULT '{}'::jsonb;

-- Create index for querying by metadata
CREATE INDEX IF NOT EXISTS idx_videos_custom_metadata
ON public.videos USING GIN (custom_metadata);

-- Add type field for future media types (video, image, audio, file)
ALTER TABLE public.videos
ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'video';

-- Create index for type filtering
CREATE INDEX IF NOT EXISTS idx_videos_media_type
ON public.videos(user_id, media_type);

-- Comment for documentation
COMMENT ON COLUMN public.videos.custom_metadata IS 'User-defined metadata JSON (companyId, userId, tags, etc.)';
COMMENT ON COLUMN public.videos.media_type IS 'Type of media: video, image, audio, file';
