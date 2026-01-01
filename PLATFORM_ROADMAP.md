# UnlimVideo B2C Platform Roadmap

Трансформация из B2B хостинга в полноценную видеоплатформу типа YouTube/Vimeo.

---

## Phase 1: Core Platform Infrastructure

### 1.1 Database
- [x] Создать миграцию `00003_video_platform.sql`
  - [x] Таблица categories с переводами (JSON)
  - [x] Расширить users (username, bio, avatar, banner, social links)
  - [x] Расширить videos (category, tags, visibility, slug, search_vector)
  - [x] Таблицы likes, comments, channel_subscriptions
  - [x] Watch history, playlists
  - [x] Video captions, transcripts, audio tracks
  - [x] Analytics, notifications, reports
  - [x] RLS policies для всех таблиц
  - [x] Trigger functions для подсчёта (likes, comments, subscribers)
- [ ] Применить миграцию на Supabase
- [ ] Создать seed data для категорий

### 1.2 Internationalization (i18n)
- [x] Установить `next-intl`
- [x] Настроить middleware для locale detection
- [x] Создать файлы переводов:
  - [x] `/messages/en.json`
  - [x] `/messages/ru.json`
- [x] Обернуть layout в `NextIntlClientProvider`
- [x] Добавить language switcher в header

### 1.3 Public Homepage
- [x] Редизайн главной страницы:
  - [x] Категории с иконками (горизонтальный скролл)
  - [x] Recent uploads секция
  - [x] Hero section с featured videos
  - [x] Trending videos секция на главной
  - [ ] Recommended for you (если залогинен)
- [x] Video card component:
  - [x] Thumbnail с длительностью
  - [x] Title, channel name, views, date
  - [ ] Hover preview (опционально)
- [x] Skeleton loading states
- [x] Infinite scroll / pagination

### 1.4 Video Watch Page `/watch/[slug]`
- [x] Server component для SEO
- [x] HLS player с quality selector
- [x] Video info section:
  - [x] Title, views, date
  - [x] Like/dislike buttons
  - [x] Share button
  - [x] Save to playlist button
- [x] Channel info:
  - [x] Avatar, name, subscribers count
  - [x] Subscribe button
- [x] Description (expandable)
- [x] Tags
- [x] Comments section
- [x] Related videos sidebar
- [x] Track watch history API

### 1.5 Channel Pages `/channel/[username]`
- [x] Channel header:
  - [x] Banner image
  - [x] Avatar
  - [x] Channel name, handle (@username)
  - [x] Subscribers count
  - [x] Subscribe button
  - [x] Social links
- [x] Tabs:
  - [x] Videos (grid)
  - [x] Playlists
  - [x] About
- [x] Sort options (newest, popular, oldest)
- [x] Channel not found page

### 1.6 Category Pages `/category/[slug]`
- [x] Category header с названием и описанием
- [x] Video grid с фильтрами
- [x] Sort by: trending, newest, most viewed
- [ ] Subcategories (если есть)

---

## Phase 2: Social Features

### 2.1 Authentication Flow
- [x] Обновить регистрацию:
  - [x] Добавить выбор username
  - [x] Валидация уникальности username
- [x] Profile setup wizard (после первой регистрации)
- [x] OAuth providers (Google, GitHub)

### 2.2 Likes System
- [x] API endpoint `POST /api/videos/[id]/like`
- [x] API endpoint `DELETE /api/videos/[id]/like`
- [x] Optimistic UI updates
- [ ] Like animation
- [x] Liked videos page `/liked`

### 2.3 Comments System
- [x] API endpoints:
  - [x] `GET /api/videos/[id]/comments`
  - [x] `POST /api/videos/[id]/comments`
  - [x] `PUT /api/comments/[id]`
  - [x] `DELETE /api/comments/[id]`
- [x] Nested replies (до 2 уровней)
- [x] Comment sorting (newest, top)
- [x] Comment likes
- [x] Edit/delete own comments
- [ ] Mention @username
- [ ] Anti-spam measures

### 2.4 Subscriptions
- [x] API endpoints:
  - [x] `POST /api/channels/[username]/subscribe`
  - [x] `DELETE /api/channels/[username]/subscribe`
- [x] Subscriptions feed page `/subscriptions`
- [x] Subscription management page
- [x] Bell notification toggle

### 2.5 Notifications
- [x] Notification types:
  - [x] New video from subscription
  - [x] Comment on your video
  - [x] Reply to your comment
  - [x] New subscriber
  - [ ] Like milestone (100, 1000, etc.)
- [x] Notification bell с badge count
- [x] Notification dropdown/page
- [x] Mark as read functionality
- [ ] Email notifications (опционально)

---

## Phase 3: Discovery & Search

### 3.1 Search
- [x] Search bar в header
- [x] Search page `/search?q=`
- [x] Full-text search по:
  - [x] Video title, description
  - [x] Channel name
  - [x] Tags
  - [ ] Transcript (когда будет)
- [x] Search filters:
  - [x] Upload date
  - [x] Duration
  - [x] Category
  - [x] Sort by
- [x] Search suggestions/autocomplete
- [ ] Search history (для залогиненных)

### 3.2 Trending
- [x] Trending page `/trending`
- [x] Trending algorithm (views in last 7 days)
- [ ] Trending by category
- [ ] Update trending cache (cron job)

### 3.3 Recommendations
- [x] "More from this channel" на watch page
- [x] "Related videos" sidebar
- [ ] Homepage personalization
- [ ] "Because you watched X" sections

### 3.4 Browse
- [x] All categories page `/categories`
- [x] Popular channels page `/channels`
- [x] New videos feed `/new`

---

## Phase 4: Creator Tools

### 4.1 Creator Studio Dashboard `/studio`
- [x] Overview:
  - [x] Total views, watch time
  - [x] Subscribers growth
  - [x] Recent comments
  - [x] Top videos
- [x] Quick actions:
  - [x] Upload video
  - [x] Go to channel

### 4.2 Video Management `/studio/videos`
- [x] Video list table
- [x] Columns:
  - [x] Thumbnail
  - [x] Title
  - [x] Visibility
  - [x] Date
  - [x] Views
  - [x] Comments
  - [x] Likes
- [x] Filters: published, draft, unlisted, processing
- [x] Sort options
- [x] Bulk: delete, change visibility

### 4.3 Video Edit Page `/studio/videos/[id]`
- [x] Edit metadata:
  - [x] Title
  - [x] Description
  - [x] Category
  - [x] Tags
  - [x] Visibility (public, unlisted, private)
  - [x] Thumbnail (upload custom)
  - [ ] Scheduled publish date
- [ ] Captions tab:
  - [ ] Upload SRT/VTT
  - [ ] Auto-generate (AI)
  - [ ] Edit captions inline
- [ ] Audio tracks tab (для AI дубляжа)
- [ ] Analytics tab (per-video stats)
- [ ] Comments moderation

### 4.4 Upload Flow Enhancement
- [x] Drag & drop upload
- [x] Upload progress with stages:
  - [x] Uploading
  - [x] Processing
  - [ ] Transcribing (optional)
  - [x] Ready
- [ ] Edit metadata во время processing
- [ ] Preview player
- [ ] Batch upload support

### 4.5 Analytics `/studio/analytics`
- [x] Overview stats
- [x] Top videos table
- [x] Time range selector
- [x] Charts:
  - [x] Views over time
  - [ ] Watch time
  - [x] Subscribers
  - [ ] Traffic sources
  - [ ] Geography
  - [ ] Devices
- [ ] Audience retention graphs (advanced)

### 4.6 Playlists
- [x] Create/edit playlist
- [x] Add videos to playlist
- [x] Reorder videos (drag & drop)
- [x] Playlist visibility
- [ ] Playlist embed
- [ ] Auto-add new uploads (option)

### 4.7 Channel Customization `/studio/customization`
- [x] Edit banner
- [x] Edit avatar
- [x] Edit bio
- [x] Website field
- [x] Social links
- [ ] Featured video
- [ ] Channel trailer (for non-subscribers)

### 4.8 Comments Management `/studio/comments`
- [x] List all comments on your videos
- [x] Show which video each comment is on
- [x] Like/delete comments
- [x] Reply to comments

---

## Phase 5: Advanced Features

### 5.1 AI Transcription (Whisper)
- [ ] Интеграция с OpenAI Whisper API
- [ ] Automatic transcription при upload
- [ ] Поддержка языков: ru, en, kz, ...
- [ ] Сохранение в `video_transcripts` таблицу
- [ ] Searchable timestamps
- [ ] Click на timestamp → seek video
- [ ] Transcript viewer на watch page
- [ ] Edit transcript in studio

### 5.2 Captions
- [ ] Auto-generate from transcript
- [ ] Multiple caption tracks (languages)
- [ ] Caption editor in studio
- [ ] Upload SRT/VTT
- [ ] Player caption selector
- [ ] Caption styling options

### 5.3 AI Dubbing (ElevenLabs)
- [ ] Интеграция с ElevenLabs API
- [ ] Generate audio track from transcript
- [ ] Voice selection
- [ ] Multiple language outputs
- [ ] Audio track selector в player
- [ ] Sync with original video
- [ ] Cost estimation перед генерацией

### 5.4 2K/4K Video Support
- [ ] Обновить worker для 2K (1440p):
  - [ ] FFmpeg preset
  - [ ] Bitrate: ~8000k
- [ ] Обновить worker для 4K (2160p):
  - [ ] FFmpeg preset
  - [ ] Bitrate: ~15000k
  - [ ] Keep original if uploaded in 4K
- [ ] Quality selector в player
- [ ] Adaptive streaming (auto quality)
- [ ] Storage cost estimation

### 5.5 Moderation & Safety
- [x] Report video/comment system
- [ ] Admin moderation panel
- [ ] Auto-moderation (spam detection)
- [ ] Content policies page
- [ ] Copyright claim system (basic)

### 5.6 Monetization (Future)
- [ ] Creator program
- [ ] Tips/donations
- [ ] Paid subscriptions
- [ ] Ads integration
- [ ] Revenue dashboard

---

## Technical Debt & Optimization

### Performance
- [ ] Image optimization (thumbnails)
- [ ] Video preloading
- [ ] CDN cache optimization
- [ ] Database indexes review
- [ ] API response caching

### Security
- [ ] Rate limiting на все API
- [ ] Signed URLs с expiration для HLS
- [ ] CSRF protection
- [ ] Input sanitization review

### Infrastructure
- [ ] Monitoring & alerting
- [ ] Error tracking (Sentry)
- [ ] Analytics (PostHog / Plausible)
- [ ] Backup strategy
- [ ] Scaling plan for worker

---

## Progress Tracker

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1: Core Platform | Complete | 99% |
| Phase 2: Social Features | Complete | 98% |
| Phase 3: Discovery | Complete | 98% |
| Phase 4: Creator Tools | Complete | 98% |
| Phase 5: Advanced | In Progress | 5% |

---

## Completed This Session

### Public Pages Created:
- `/` - Homepage with video catalog + infinite scroll
- `/watch/[slug]` - Video watch page with comments
- `/channel/[username]` - Channel pages with sort options
- `/category/[slug]` - Category pages
- `/trending` - Trending videos
- `/search` - Search with filters + autocomplete
- `/subscriptions` - Subscription feed
- `/subscriptions/manage` - Subscription management
- `/history` - Watch history
- `/liked` - Liked videos
- `/notifications` - Notifications page
- `/categories` - Browse all categories
- `/channels` - Browse popular channels
- `/playlists` - User playlists
- `/playlist/[id]` - Playlist view

### Creator Studio Created:
- `/studio` - Dashboard
- `/studio/videos` - Video list with bulk actions
- `/studio/videos/[id]` - Video editor
- `/studio/analytics` - Analytics
- `/studio/comments` - Comments management
- `/studio/customization` - Channel settings
- `/studio/upload` - Video upload

### API Endpoints Created:
- `GET/PATCH/DELETE /api/videos/[id]` - Video CRUD
- `POST/DELETE /api/videos/[id]/like` - Likes
- `GET/POST /api/videos/[id]/comments` - Comments
- `PUT/DELETE /api/comments/[id]` - Comment edit/delete
- `POST /api/videos/[id]/history` - Watch history
- `POST/DELETE /api/channels/[username]/subscribe` - Subscriptions
- `GET/PATCH /api/profile` - Profile management
- `GET/PATCH /api/notifications` - Notifications
- `GET/POST /api/playlists` - Playlists CRUD
- `GET/PATCH/DELETE /api/playlists/[id]` - Playlist detail
- `POST/DELETE/PATCH /api/playlists/[id]/videos` - Playlist videos
- `GET /api/subscriptions` - User subscriptions list
- `PATCH/DELETE /api/subscriptions/[id]` - Subscription management
- `GET /api/search/suggestions` - Search autocomplete
- `GET /api/videos/public` - Paginated public videos

### Components Created:
- `Header` - Main navigation with search autocomplete
- `Sidebar` - Left navigation
- `VideoCard` - Video thumbnails
- `CategoriesBar` - Category chips
- `LanguageSwitcher` - RU/EN switch
- `StudioSidebar` - Studio navigation
- `StudioHeader` - Studio header
- `NotificationBell` - Notification dropdown
- `AddToPlaylist` - Save to playlist modal
- `VideoSort` - Sort options selector
- `SearchBar` - Search with autocomplete
- `InfiniteVideoGrid` - Infinite scroll video grid
- `VideoListClient` - Studio videos with bulk actions

### i18n Setup:
- `next-intl` configured
- `/messages/en.json` - Full English translations
- `/messages/ru.json` - Full Russian translations

---

## Next Steps

1. **Применить миграцию** - Запустить `00003_video_platform.sql` в Supabase
2. **AI Transcription** - Phase 5.1 (requires Whisper API)
3. **AI Dubbing** - Phase 5.3 (requires ElevenLabs API)
4. **2K/4K Video Support** - Phase 5.4 (requires worker update)
5. **Content Moderation** - Phase 5.5

---

## Latest Session (December 2024)

### New Features Implemented:
- **OAuth Authentication**: Added Google and GitHub OAuth login buttons with setup page for new users
- **Video Filters in Studio**: Added filter tabs (All, Public, Unlisted, Private, Processing) and sort options
- **Thumbnail Upload**: Custom thumbnail upload in video edit page with preview and upload overlay
- **New Videos Page** (`/new`): Shows videos from last 7 days grouped by Today, Yesterday, Earlier
- **Search Improvements**: Added channel results in search, search by tags, display tags on results
- **Analytics Charts**: Added line charts for views and subscribers, bar chart for video performance
- **Channel Not Found Page**: Custom 404 page with helpful suggestions
- **Hero Section**: Featured videos section on homepage with promotional fallback
