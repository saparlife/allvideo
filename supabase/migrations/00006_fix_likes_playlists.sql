-- Fix likes table - remove is_like requirement (or make it default to true)
-- The API just needs simple like/unlike, not like/dislike
ALTER TABLE likes ALTER COLUMN is_like SET DEFAULT true;

-- Fix playlists table - add missing columns that API expects
ALTER TABLE playlists ADD COLUMN IF NOT EXISTS title VARCHAR(200);
ALTER TABLE playlists ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'public';

-- Migrate data from old columns to new
UPDATE playlists SET title = name WHERE title IS NULL AND name IS NOT NULL;
UPDATE playlists SET visibility = CASE WHEN is_public = true THEN 'public' ELSE 'private' END WHERE visibility IS NULL;

-- Make title NOT NULL after migration
-- ALTER TABLE playlists ALTER COLUMN title SET NOT NULL;
