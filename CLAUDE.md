# Claude Context - AllVideo

## Что это за проект

AllVideo.one — платформа для хостинга видео с автоматическим HLS транскодированием. Пользователь загружает видео, система конвертирует в несколько качеств (360p-1080p), выдаёт embed код.

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

## Как работает транскодирование

1. Пользователь загружает видео → R2 (через presigned URL)
2. Создаётся запись в Supabase: `videos` + `transcode_jobs`
3. Worker (polling каждые 10 сек) берёт задачу
4. FFmpeg конвертирует в HLS (несколько качеств)
5. Загружает сегменты в R2
6. Обновляет статус в Supabase → "completed"

## Ключевые файлы

- `worker/src/index.ts` — логика транскодирования
- `worker/.env` — ключи Supabase + R2 (на сервере)
- `src/app/api/videos/` — API endpoints
- `supabase/migrations/` — схема БД

## Другие сервисы на том же сервере

- **Nextcloud** (облако): http://65.21.195.154:8080
- Документация сервера: `/Users/sapar/Documents/server/`

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
-- В Supabase SQL Editor
SELECT * FROM transcode_jobs WHERE status = 'pending' ORDER BY created_at;
```
