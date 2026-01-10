# @1stream/sdk

Official TypeScript/JavaScript SDK for [stream.1app.to](https://stream.1app.to) - Universal Media Storage API for Developers.

## Installation

```bash
npm install @1stream/sdk
# or
yarn add @1stream/sdk
# or
pnpm add @1stream/sdk
```

## Quick Start

```typescript
import OneStream from '@1stream/sdk';

const client = new OneStream({
  apiKey: 'your-api-key',
});

// Upload a video
const video = await client.uploadVideo(file, {
  title: 'My Video',
  metadata: { projectId: 'proj_123' },
});

console.log(video.hlsUrl); // HLS streaming URL
```

## Usage Examples

### Upload Media

```typescript
// Upload any file (auto-detect type)
const media = await client.upload(file, {
  title: 'My File',
  metadata: { userId: 'user_456' },
});

// Upload specific types
const video = await client.uploadVideo(videoFile);
const image = await client.uploadImage(imageFile, { preset: 'avatar' });
const audio = await client.uploadAudio(audioFile);
const file = await client.uploadFile(pdfFile, { public: false });
```

### Get Media

```typescript
// Get by ID
const video = await client.getVideo('video_id');
const image = await client.getImage('image_id');

// Get any media (auto-detect type)
const media = await client.get('media_id');

// Get file with signed download URL
const file = await client.getFile('file_id', {
  download: true,
  expires: 3600, // 1 hour
});
```

### List Media

```typescript
// List all media
const { items } = await client.list();

// Filter by type
const { items: videos } = await client.list({ type: 'video' });

// Filter by status
const { items: ready } = await client.list({ status: 'ready' });

// Filter by custom metadata
const { items: projectMedia } = await client.list({
  metadata: { projectId: 'proj_123' },
});

// Pagination
const { items: page2 } = await client.list({
  limit: 20,
  offset: 20,
});
```

### Update Media

```typescript
await client.update('media_id', {
  title: 'New Title',
  metadata: { updated: true },
});
```

### Delete Media

```typescript
await client.deleteVideo('video_id');
await client.deleteImage('image_id');

// Or auto-detect type
await client.delete('media_id');
```

## Image Processing

```typescript
// Upload with preset
const avatar = await client.uploadImage(file, {
  preset: 'avatar', // 150x150, 300x300
});

// Upload with format conversion
const webp = await client.uploadImage(file, {
  format: 'webp',
});

// Access variants
console.log(avatar.variants.thumbnail);
console.log(avatar.variants.small);
console.log(avatar.variants.medium);
console.log(avatar.variants.large);
```

## Custom Metadata

Store and query any custom data:

```typescript
// Upload with metadata
const video = await client.uploadVideo(file, {
  metadata: {
    companyId: 'comp_123',
    userId: 'user_456',
    projectId: 'proj_789',
    tags: ['demo', 'tutorial'],
  },
});

// Query by metadata
const { items } = await client.list({
  metadata: {
    companyId: 'comp_123',
    userId: 'user_456',
  },
});
```

## Error Handling

```typescript
import { OneStreamError } from '@1stream/sdk';

try {
  const video = await client.getVideo('invalid_id');
} catch (error) {
  if (error instanceof OneStreamError) {
    console.log(error.statusCode); // 404
    console.log(error.message); // "Video not found"
    console.log(error.code); // Optional error code
  }
}
```

## Configuration

```typescript
const client = new OneStream({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.stream.1app.to', // Optional, defaults to production
});
```

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import type {
  MediaItem,
  VideoItem,
  ImageItem,
  AudioItem,
  FileItem,
  UploadOptions,
  ListOptions,
} from '@1stream/sdk';
```

## Response Types

### VideoItem

```typescript
{
  id: string;
  type: 'video';
  title: string;
  status: 'uploading' | 'processing' | 'ready' | 'failed';
  url?: string;
  hlsUrl?: string;
  thumbnailUrl?: string;
  size: number;
  mimeType?: string;
  width?: number;
  height?: number;
  duration?: number;
  qualities?: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
}
```

### ImageItem

```typescript
{
  id: string;
  type: 'image';
  title: string;
  status: 'ready' | 'processing' | 'failed';
  url?: string;
  thumbnailUrl?: string;
  size: number;
  width?: number;
  height?: number;
  variants?: {
    thumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
  };
  dominantColor?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
```

## License

MIT
