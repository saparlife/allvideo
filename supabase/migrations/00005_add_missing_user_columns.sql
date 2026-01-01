-- Add missing columns to users table for channel customization

ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS banner_url VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscribers_count INTEGER DEFAULT 0;
