# Changelog

## 2025-12-22

### Worker Fixes

#### FFmpeg Buffer Blocking Fix
- **Problem**: FFmpeg processes were hanging indefinitely during transcoding
- **Root Cause**: Node.js `spawn()` wasn't consuming stdout/stderr streams, causing buffer overflow (200KB limit) which blocked FFmpeg
- **Solution**: Added stream consumption handlers to all spawn calls in `worker/src/transcoder.ts`:
  ```typescript
  ffmpeg.stdout.on("data", () => {});
  ffmpeg.stderr.on("data", () => {});
  ```
- **Files**: `worker/src/transcoder.ts`

#### Database Update Fix in completeJob
- **Problem**: Video status wasn't updating to "ready" after successful transcoding
- **Root Cause**: `completeJob()` was trying to write to non-existent columns (`hls_url`, `thumbnail_url`)
- **Solution**: Changed to use correct column names (`hls_key`, `thumbnail_key`) and added error logging
- **Files**: `worker/src/supabase.ts`

#### Thumbnail Path Fix
- **Problem**: Thumbnail wasn't displaying - path mismatch between upload location and database
- **Root Cause**: Separate `uploadFile()` for thumbnail was failing silently, but `uploadDirectory()` already uploads `poster.jpg` to HLS folder
- **Solution**: Simplified to use HLS folder path for thumbnail (`hls/.../poster.jpg` instead of `thumbnails/.../poster.jpg`)
- **Files**: `worker/src/index.ts`

### Frontend Fixes

#### Multipart Upload Implementation
- Implemented parallel chunk upload (4 concurrent) for large files
- Added upload speed display (Mbps)
- Added cancel upload functionality
- **Files**:
  - `src/app/api/videos/upload/init/route.ts`
  - `src/app/api/videos/upload/complete/route.ts`
  - `src/app/(dashboard)/videos/upload/page.tsx`

#### Page Navigation Speed
- Converted dashboard layout and pages to client components
- Added loading.tsx skeleton files for instant page transitions
- **Files**: `src/app/(dashboard)/layout.tsx`, various page files

#### Environment Variables
- Added `NEXT_PUBLIC_R2_PUBLIC_URL` for client-side R2 URL access
- **Files**: `.env.local`

### Bug Fixes
- Fixed header crash on undefined email with optional chaining
- Fixed stuck "uploading" videos cleanup (auto-cleanup after 1 hour)
- Fixed transcode job not being created (removed broken RPC call)

## Transcoding Results (Test Video)
- **Input**: 322MB, 10 minutes, 1080p60 H.264
- **Output**: HLS with 4 quality levels (360p, 480p, 720p, 1080p)
- **Time**: ~9 minutes on Hetzner server (slow preset)
- **Segments**: 146 per quality level

## TODO
- [ ] Setup custom domain for R2 (cdn.unlimvideo.com) to hide backend URLs
- [ ] Fix progress percentage during transcoding (regex not matching FFmpeg output)
- [ ] Add retry logic for failed uploads
