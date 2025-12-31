-- Allow anonymous users to view videos with status 'ready' (for embed page)
CREATE POLICY "Public can view ready videos"
ON videos
FOR SELECT
TO anon
USING (status = 'ready');
