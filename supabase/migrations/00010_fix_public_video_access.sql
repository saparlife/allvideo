-- Fix RLS policy for public video access (embed pages)
-- Drop all existing policies for videos table and recreate them properly

-- First, ensure RLS is enabled
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Public can view ready videos" ON videos;
DROP POLICY IF EXISTS "Users can view their own videos" ON videos;
DROP POLICY IF EXISTS "Users can insert their own videos" ON videos;
DROP POLICY IF EXISTS "Users can update their own videos" ON videos;
DROP POLICY IF EXISTS "Users can delete their own videos" ON videos;

-- Policy 1: Anyone (including anonymous) can view public/unlisted ready videos
CREATE POLICY "Anyone can view public ready videos"
ON videos
FOR SELECT
TO anon, authenticated
USING (
  status = 'ready'
  AND visibility IN ('public', 'unlisted')
);

-- Policy 2: Owners can view all their own videos (any status/visibility)
CREATE POLICY "Owners can view own videos"
ON videos
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy 3: Owners can insert their own videos
CREATE POLICY "Owners can insert videos"
ON videos
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Policy 4: Owners can update their own videos
CREATE POLICY "Owners can update own videos"
ON videos
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy 5: Owners can delete their own videos
CREATE POLICY "Owners can delete own videos"
ON videos
FOR DELETE
TO authenticated
USING (user_id = auth.uid());
