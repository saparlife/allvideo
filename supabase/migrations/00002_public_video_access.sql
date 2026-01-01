-- Allow anonymous users to view videos with status 'ready' (for embed page)
DROP POLICY IF EXISTS "Public can view ready videos" ON videos;
CREATE POLICY "Public can view ready videos"
ON videos
FOR SELECT
TO anon
USING (status = 'ready');
