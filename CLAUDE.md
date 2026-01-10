# Claude Context - 1stream.dev

## Что это за проект

1stream.dev — универсальный Media Storage API для разработчиков. Один API для всех медиа-нужд: видео, изображения, аудио, файлы.

## Архитектура

```
Frontend (Next.js) → Vercel
Database → Supabase (PostgreSQL)
Storage → Cloudflare R2
Worker → Hetzner сервер (Docker)
```

## Production Worker

**Сервер:** 65.21.195.154 (Hetzner, Ubuntu 24.04)
**Worker ID:** hetzner-worker-1
**Путь:** /data/docker/worker/

```bash
# SSH доступ
ssh root@65.21.195.154

# Логи worker
ssh root@65.21.195.154 "docker logs -f worker-worker-1"

# Перезапуск
ssh root@65.21.195.154 "cd /data/docker/worker && docker compose restart"
```

## Как работает обработка медиа

### Video
1. Upload → R2 (presigned URL)
2. Создаётся `media` + `jobs` записи
3. Worker (polling) берёт задачу
4. FFmpeg → HLS (несколько качеств)
5. Upload сегментов в R2
6. Статус → "ready"

### Image (планируется)
- Sharp.js для resize/compress
- Синхронно в API (быстро)

### Audio (планируется)
- FFmpeg → MP3
- Waveform generation
- Синхронно в API

### Files (планируется)
- Прямой upload в R2
- PDF preview (первая страница)

## Ключевые файлы

- `worker/src/index.ts` — логика обработки
- `worker/.env` — ключи Supabase + R2 (на сервере)
- `src/app/api/` — API endpoints
- `supabase/migrations/` — схема БД
- `plan.md` — план разработки

## API Structure (цель)

```
POST /api/v1/upload          - Universal upload
POST /api/v1/videos          - Video upload
POST /api/v1/images          - Image upload
POST /api/v1/audio           - Audio upload
POST /api/v1/files           - File upload
GET  /api/v1/media           - List all media
```

## Частые задачи

### Обновить код worker
```bash
scp -r worker/* root@65.21.195.154:/data/docker/worker/
ssh root@65.21.195.154 "cd /data/docker/worker && docker compose up -d --build"
```

### Проверить что worker работает
```bash
ssh root@65.21.195.154 "docker logs --tail 20 worker-worker-1"
```

### Посмотреть очередь задач
```sql
SELECT * FROM jobs WHERE status = 'pending' ORDER BY created_at;
```
