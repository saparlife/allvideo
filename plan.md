# 1stream.dev — Implementation Plan

## Phase 1: Rebranding
- [x] Rename project to 1stream
- [x] Update package.json (name, description)
- [x] Update all UI references (landing, sidebar, auth, pricing)
- [x] Update worker references
- [x] Update CLAUDE.md
- [x] Create new landing page (developer-focused)
- [x] Commit: "Rebrand to 1stream.dev"

## Phase 2: Unified API Structure
- [ ] Create unified media table schema
- [ ] Add custom_metadata JSONB field (for companyId, userId, etc.)
- [ ] Create /api/v1/upload universal endpoint
- [ ] Auto-detect file type (video/image/audio/file)
- [ ] Refactor existing video endpoints to /api/v1/videos
- [ ] Commit: "Add unified API structure with custom metadata"

## Phase 3: Image Processing
- [ ] Add Sharp.js to worker dependencies
- [ ] Create /api/v1/images endpoint
- [ ] Implement image upload to R2
- [ ] Add image processing (resize, compress, WebP)
- [ ] Generate variants (thumbnail, medium, large)
- [ ] Add presets support (avatar, product, etc.)
- [ ] Commit: "Add image processing with variants"

## Phase 4: Audio Processing
- [ ] Create /api/v1/audio endpoint
- [ ] Implement audio upload to R2
- [ ] Add FFmpeg audio transcoding (→ MP3)
- [ ] Generate waveform peaks JSON
- [ ] Extract metadata (duration, bitrate, ID3 tags)
- [ ] Commit: "Add audio processing with waveform"

## Phase 5: File Storage
- [ ] Create /api/v1/files endpoint
- [ ] Implement file upload to R2
- [ ] Add signed URLs with expiration
- [ ] PDF preview generation (first page → PNG)
- [ ] Commit: "Add file storage with PDF preview"

## Phase 6: Webhooks
- [ ] Create webhooks table
- [ ] Add webhook configuration in dashboard
- [ ] Implement webhook delivery (media.ready, media.failed)
- [ ] Add retry logic
- [ ] Commit: "Add webhook system"

## Phase 7: SDK & Docs
- [ ] Create @1stream/sdk package
- [ ] JavaScript/TypeScript SDK
- [ ] React components (VideoPlayer, AudioPlayer)
- [ ] API documentation page
- [ ] Commit: "Add SDK and documentation"

---

## API Endpoints (Final)

```
POST   /api/v1/upload              - Universal upload (auto-detect type)
                                     Accepts: custom_metadata JSON

POST   /api/v1/videos              - Video upload
GET    /api/v1/videos/:id          - Get video info
DELETE /api/v1/videos/:id          - Delete video

POST   /api/v1/images              - Image upload
GET    /api/v1/images/:id          - Get image info
DELETE /api/v1/images/:id          - Delete image

POST   /api/v1/audio               - Audio upload
GET    /api/v1/audio/:id           - Get audio info
DELETE /api/v1/audio/:id           - Delete audio

POST   /api/v1/files               - File upload
GET    /api/v1/files/:id           - Get file info
DELETE /api/v1/files/:id           - Delete file

GET    /api/v1/media               - List all media (with filters)
GET    /api/v1/usage               - Usage stats
```

## Custom Metadata Example

```bash
POST /api/v1/upload
Content-Type: multipart/form-data

file: <binary>
custom_metadata: {"companyId": "comp_123", "userId": "user_456", "projectId": "proj_789"}
```

Response includes your metadata:
```json
{
  "id": "med_abc",
  "type": "image",
  "custom_metadata": {
    "companyId": "comp_123",
    "userId": "user_456",
    "projectId": "proj_789"
  },
  ...
}
```

Query by metadata:
```bash
GET /api/v1/media?companyId=comp_123&userId=user_456
```

---

## Worker Tasks

| Task | Tool | Time | Sync/Async |
|------|------|------|------------|
| video_transcode | FFmpeg | minutes | Async (queue) |
| image_process | Sharp | seconds | Sync in API |
| audio_transcode | FFmpeg | seconds | Sync in API |
| waveform_generate | FFmpeg | seconds | Sync in API |
| pdf_preview | pdf-lib | seconds | Sync in API |

Only video needs the heavy worker queue. Everything else processes inline.

---

## Current Progress

Started: Phase 1
