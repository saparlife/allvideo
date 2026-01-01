-- Add transcription fields to videos table
ALTER TABLE videos
ADD COLUMN IF NOT EXISTS transcript_text TEXT,
ADD COLUMN IF NOT EXISTS transcript_vtt TEXT,
ADD COLUMN IF NOT EXISTS transcript_segments JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS transcript_language VARCHAR(10),
ADD COLUMN IF NOT EXISTS transcription_status VARCHAR(20) DEFAULT 'pending';

-- Index for searching video content
CREATE INDEX IF NOT EXISTS idx_videos_transcript_text ON videos USING gin(to_tsvector('english', COALESCE(transcript_text, '')));

-- Comment
COMMENT ON COLUMN videos.transcript_text IS 'Full text transcript of the video';
COMMENT ON COLUMN videos.transcript_vtt IS 'VTT format subtitles with timestamps';
COMMENT ON COLUMN videos.transcript_segments IS 'JSON array of {start, end, text} segments';
COMMENT ON COLUMN videos.transcription_status IS 'pending, processing, completed, failed, skipped';
