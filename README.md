# AllVideo.one

Video hosting platform with automatic HLS transcoding. Upload videos, get multi-quality streaming with adaptive bitrate.

## Features

- **Video Upload** - Direct upload to Cloudflare R2 with presigned URLs
- **HLS Transcoding** - Automatic conversion to multiple quality levels (360p, 480p, 720p, 1080p)
- **Adaptive Streaming** - HLS player with automatic quality switching
- **Dashboard** - Manage videos, view stats, get embed codes
- **API Keys** - Programmatic access for integrations
- **Admin Panel** - User management, video moderation

## Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Radix UI** - Accessible components
- **hls.js** - HLS video playback

### Backend
- **Supabase** - PostgreSQL database, Auth, Row Level Security
- **Cloudflare R2** - Object storage for videos
- **Next.js API Routes** - REST API endpoints

### Worker (VPS)
- **Node.js** - Transcoding worker
- **FFmpeg** - Video transcoding to HLS
- **Docker** - Container deployment

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js App   │────▶│    Supabase     │◀────│  Worker (VPS)   │
│   (Vercel)      │     │   (Database)    │     │   (Docker)      │
└────────┬────────┘     └─────────────────┘     └────────┬────────┘
         │                                               │
         │              ┌─────────────────┐              │
         └─────────────▶│  Cloudflare R2  │◀─────────────┘
                        │    (Storage)    │
                        └─────────────────┘
```

1. User uploads video → presigned URL → R2
2. Video record created in Supabase with `status: uploading`
3. Transcode job added to queue
4. Worker polls queue, claims job
5. Worker downloads original, transcodes to HLS
6. Worker uploads HLS segments to R2
7. Worker updates video `status: ready`

## Setup

### Prerequisites

- Node.js 18+
- Supabase account
- Cloudflare R2 bucket
- VPS with Docker (for worker)

### 1. Clone & Install

```bash
git clone https://github.com/saparlife/allvideo.git
cd allvideo
npm install
```

### 2. Environment Variables

Create `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Cloudflare R2
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET=allvideo-storage
R2_PUBLIC_URL=https://pub-xxx.r2.dev
```

### 3. Database Setup

Run migration in Supabase SQL Editor:

```bash
# File: supabase/migrations/00001_initial_schema.sql
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Infrastructure (Production)

Worker работает на выделенном сервере Hetzner:

| Параметр | Значение |
|----------|----------|
| **IP** | 65.21.195.154 |
| **SSH** | `ssh root@65.21.195.154` |
| **OS** | Ubuntu 24.04 LTS |
| **Worker ID** | hetzner-worker-1 |
| **Путь** | /data/docker/worker/ |

### Как работает Worker

```
1. Worker polling Supabase каждые 10 сек
2. Находит задачу со статусом "pending"
3. Ставит статус "processing", указывает worker_id
4. Скачивает видео, транскодирует FFmpeg → HLS
5. Загружает в Cloudflare R2
6. Ставит статус "completed"
```

Worker автономный — имеет `SUPABASE_SERVICE_ROLE_KEY` и `R2` ключи в `.env`.

### Управление Worker

```bash
# Статус
ssh root@65.21.195.154 "docker ps | grep worker"

# Логи
ssh root@65.21.195.154 "docker logs -f worker-worker-1"

# Перезапуск
ssh root@65.21.195.154 "cd /data/docker/worker && docker compose restart"

# Пересборка (после изменений кода)
ssh root@65.21.195.154 "cd /data/docker/worker && docker compose up -d --build"
```

### Обновление Worker

```bash
# Скопировать новый код
scp -r worker/* root@65.21.195.154:/data/docker/worker/

# Пересобрать и запустить
ssh root@65.21.195.154 "cd /data/docker/worker && docker compose up -d --build"
```

### Документация сервера

Полная документация: `/Users/sapar/Documents/server/`

---

## Worker Setup (Local/Dev)

### 1. Install Docker

```bash
curl -fsSL https://get.docker.com | sh
```

### 2. Deploy Worker

```bash
cd worker
cp .env.example .env
# Edit .env with your credentials

docker compose up -d
```

### 3. Check Logs

```bash
docker logs worker-worker-1 -f
```

## API Endpoints

### Public API (requires API key)

```
GET  /api/public/videos          - List videos
GET  /api/public/videos/:id      - Get video details
POST /api/public/videos          - Init upload
POST /api/public/videos/:id/complete - Complete upload
```

### Internal API

```
POST /api/videos/upload/init     - Get presigned upload URL
POST /api/videos/upload/complete - Mark upload complete
```

## Database Schema

| Table | Description |
|-------|-------------|
| `users` | User profiles (extends auth.users) |
| `subscriptions` | User subscription plans |
| `videos` | Video metadata and status |
| `transcode_jobs` | Transcoding queue |
| `api_keys` | API key management |

## HLS Output

Videos are transcoded to multiple quality levels:

| Quality | Resolution | Bitrate |
|---------|------------|---------|
| 360p | 640x360 | 800 kbps |
| 480p | 854x480 | 1400 kbps |
| 720p | 1280x720 | 2800 kbps |
| 1080p | 1920x1080 | 5000 kbps |

Output structure in R2:
```
users/{user_id}/hls/{video_id}/
├── master.m3u8
├── v0/playlist.m3u8
├── v0/segment000.ts
├── v1/playlist.m3u8
└── ...
```

## Deployment

### Frontend (Vercel)

```bash
vercel
```

### Worker (VPS)

```bash
ssh root@your-vps
cd /root/allvideo/worker
git pull
docker compose down
docker compose up -d --build
```

## License

MIT
