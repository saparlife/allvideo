# stream.1app.to — Инструкции для Claude

## 🗣️ ЯЗЫК ОБЩЕНИЯ

**ВСЕГДА отвечай на РУССКОМ языке.** Без исключений.

## 🚫 GIT PUSH

**НИКОГДА не делай `git push` автоматически.** Только коммит. Пуш — только по явной просьбе пользователя.

---

## Что это за проект

stream.1app.to — универсальный Media Storage API для разработчиков. Один API для всех медиа-нужд: видео, изображения, аудио, файлы.

**Ключевые особенности:**
- B2B API с одним ключом на много клиентов
- Любой тип файла поддерживается
- Видео → автоматическое HLS транскодирование
- Изображения → варианты размеров
- Аудио/Файлы → прямое хранение

---

## ⛔ ОБЯЗАТЕЛЬНЫЕ ПРАВИЛА

### TypeScript
- ❌ НЕ использовать `: any` — только `unknown` или конкретные типы
- ✅ Для catch: `catch (err: unknown)` + `err instanceof Error ? err.message : "Unknown"`
- ✅ Для объектов: `Record<string, unknown>` или конкретный interface

### Валидация файлов
Все загрузки через `src/lib/validation/file.ts`:
```typescript
import { validateFile, type SubscriptionTier } from "@/lib/validation/file";

const validation = validateFile(filename, sizeBytes, tier);
if (!validation.valid) {
  return apiError(validation.error!, 400);
}
const sanitizedFilename = validation.sanitizedFilename!;
```

### API Responses
Единый формат через `src/lib/api/response.ts`:
```typescript
import { apiSuccess, apiError } from "@/lib/api/response";

// Успех
return apiSuccess({ id: "123", url: "..." });

// Ошибка
return apiError("File too large", 400);
```

### Перед коммитом ВСЕГДА:
```bash
npm run build      # Сборка без ошибок
```

---

## Архитектура

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js App   │────▶│    Supabase     │────▶│  Cloudflare R2  │
│    (Vercel)     │     │  (PostgreSQL)   │     │   (Storage)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │
                                ▼
                        ┌─────────────────┐
                        │  Worker (VPS)   │
                        │  FFmpeg + HLS   │
                        └─────────────────┘
```

**Production:**
- Frontend: Vercel
- Database: Supabase (PostgreSQL)
- Storage: Cloudflare R2
- Worker: Hetzner VPS (65.21.195.154)

---

## Структура папок

```
src/
├── app/
│   ├── (auth)/          # Login, Register
│   ├── (dashboard)/     # Защищённые страницы
│   │   ├── dashboard/   # Главная
│   │   ├── videos/      # Видео
│   │   ├── images/      # Изображения
│   │   ├── audio/       # Аудио
│   │   ├── files/       # Файлы
│   │   ├── api-keys/    # API ключи
│   │   ├── webhooks/    # Webhooks
│   │   └── settings/    # Настройки
│   ├── (admin)/         # Админка
│   ├── api/
│   │   ├── v1/          # Public API (с API ключом)
│   │   │   ├── upload/  # Универсальный upload
│   │   │   ├── videos/  # Video endpoints
│   │   │   ├── images/  # Image endpoints
│   │   │   ├── audio/   # Audio endpoints
│   │   │   └── files/   # File endpoints
│   │   ├── health/      # Health checks
│   │   ├── webhooks/    # Webhook handlers
│   │   └── cron/        # Cron jobs
│   ├── embed/[id]/      # Embed player
│   └── pricing/         # Pricing page
├── components/
│   ├── ui/              # shadcn/ui компоненты
│   ├── video/           # Video player
│   └── layout/          # Layout компоненты
├── lib/
│   ├── api/             # API helpers (response, auth)
│   ├── r2/              # R2 storage client
│   ├── supabase/        # Supabase clients
│   ├── validation/      # File validation
│   ├── webhooks/        # Webhook sender
│   └── processing/      # Image processing
└── types/               # TypeScript типы

worker/
├── src/
│   ├── index.ts         # Main loop + graceful shutdown
│   ├── config.ts        # Environment validation
│   ├── supabase.ts      # DB operations
│   ├── r2.ts            # Storage operations
│   └── transcoder.ts    # FFmpeg HLS encoding
└── Dockerfile
```

---

## API Structure

### Public API (требует API ключ)
```
POST /api/v1/upload          - Универсальный upload (auto-detect type)
POST /api/v1/videos          - Video upload → HLS
POST /api/v1/images          - Image upload → variants
POST /api/v1/audio           - Audio upload
POST /api/v1/files           - File upload
GET  /api/v1/media           - List all media
GET  /api/v1/media/[id]      - Get media details
DELETE /api/v1/media/[id]    - Delete media
```

### Internal API (требует авторизацию)
```
GET  /api/videos             - Dashboard list
POST /api/media/upload       - Dashboard upload
GET  /api/health             - Health check
GET  /api/health/worker      - Worker status
```

---

## Как работает обработка медиа

### Video (async)
1. Upload → R2 (presigned URL)
2. Создаётся `videos` + `transcode_jobs` записи
3. Worker (polling 10s) берёт задачу
4. FFmpeg → HLS (360p, 480p, 720p, 1080p)
5. Upload сегментов в R2
6. Webhook → статус "ready"

### Image (sync)
- Sharp.js для resize/compress
- Создаёт варианты: thumb, medium, large
- Синхронно в API

### Audio/Files (sync)
- Прямой upload в R2
- Без обработки

---

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

# Health check
curl https://stream.1app.to/api/health
curl https://stream.1app.to/api/health/worker
```

---

## Команды

```bash
# Development
npm run dev             # Запуск dev сервера
npm run build           # Production сборка

# Worker
npm run worker:dev      # Локальный worker
npm run worker:deploy   # Deploy на сервер (если есть скрипт)

# Database
npx supabase gen types typescript --project-id PROJECT_ID > src/types/supabase.ts

# Deploy worker вручную
scp -r worker/* root@65.21.195.154:/data/docker/worker/
ssh root@65.21.195.154 "cd /data/docker/worker && docker compose up -d --build"
```

---

## Лимиты по тарифам

| Тариф | Max File Size | Storage |
|-------|---------------|---------|
| Free | 500 MB | 5 GB |
| Starter | 2 GB | 50 GB |
| Pro | 5 GB | 200 GB |
| Business | 10 GB | 500 GB |
| Enterprise | 50 GB | 2 TB |
| Ultimate | 100 GB | 10 TB |

---

## Частые задачи

### Обновить код worker
```bash
scp -r worker/* root@65.21.195.154:/data/docker/worker/
ssh root@65.21.195.154 "cd /data/docker/worker && docker compose up -d --build"
```

### Посмотреть очередь задач
```sql
-- В Supabase SQL Editor
SELECT * FROM transcode_jobs WHERE status = 'pending' ORDER BY created_at;
SELECT * FROM transcode_jobs WHERE status = 'processing';
```

### Проверить storage usage
```sql
SELECT
  u.email,
  s.storage_used_bytes / 1024 / 1024 as used_mb,
  s.storage_limit_bytes / 1024 / 1024 as limit_mb
FROM subscriptions s
JOIN auth.users u ON u.id = s.user_id;
```

---

## Технический долг

Смотри `TECH_DEBT.md` для полного списка задач.

**Приоритеты:**
- ✅ P0 (Critical) — Выполнено
- 🟡 P1 (Important) — 14-18 часов
- 🟢 P2 (Improvements) — 14-18 часов
- 🔵 P3 (Nice to Have) — 10+ часов
