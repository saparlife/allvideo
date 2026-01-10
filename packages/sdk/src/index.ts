/**
 * 1stream SDK
 * Universal Media Storage API for Developers
 */

export interface OneStreamConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface UploadOptions {
  title?: string;
  metadata?: Record<string, unknown>;
  public?: boolean;
}

export interface MediaItem {
  id: string;
  type: "video" | "image" | "audio" | "file";
  title: string;
  status: "uploading" | "processing" | "ready" | "failed";
  url?: string;
  thumbnailUrl?: string;
  size: number;
  mimeType?: string;
  width?: number;
  height?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface VideoItem extends MediaItem {
  type: "video";
  hlsUrl?: string;
  duration?: number;
  qualities?: string[];
}

export interface ImageItem extends MediaItem {
  type: "image";
  variants?: {
    thumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
  };
  dominantColor?: string;
}

export interface AudioItem extends MediaItem {
  type: "audio";
  duration?: number;
  waveformUrl?: string;
}

export interface FileItem extends MediaItem {
  type: "file";
  downloadUrl?: string;
  signedUrl?: string;
}

export interface ListOptions {
  type?: "video" | "image" | "audio" | "file";
  status?: "ready" | "processing" | "failed";
  limit?: number;
  offset?: number;
  metadata?: Record<string, string>;
}

export interface UploadResult {
  id: string;
  uploadUrl?: string;
  status: string;
}

class OneStreamError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = "OneStreamError";
  }
}

export class OneStream {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: OneStreamConfig) {
    if (!config.apiKey) {
      throw new Error("API key is required");
    }
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || "https://stream.1app.to";
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      ...(options.headers as Record<string, string>),
    };

    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new OneStreamError(
        data.error || "Request failed",
        response.status,
        data.code
      );
    }

    return data;
  }

  // ===================
  // Upload Methods
  // ===================

  /**
   * Upload a file directly
   */
  async upload(
    file: File | Blob,
    options: UploadOptions = {}
  ): Promise<MediaItem> {
    const formData = new FormData();
    formData.append("file", file);
    if (options.title) formData.append("title", options.title);
    if (options.metadata) {
      formData.append("metadata", JSON.stringify(options.metadata));
    }
    if (options.public !== undefined) {
      formData.append("public", String(options.public));
    }

    return this.request<MediaItem>("/api/v1/upload", {
      method: "POST",
      body: formData,
    });
  }

  /**
   * Get a presigned URL for uploading
   */
  async createUpload(
    filename: string,
    contentType: string,
    size: number,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    return this.request<UploadResult>("/api/v1/upload", {
      method: "POST",
      body: JSON.stringify({
        filename,
        contentType,
        size,
        title: options.title,
        metadata: options.metadata,
        public: options.public,
      }),
    });
  }

  /**
   * Mark an upload as complete (after using presigned URL)
   */
  async completeUpload(id: string): Promise<MediaItem> {
    return this.request<MediaItem>(`/api/v1/upload/complete`, {
      method: "POST",
      body: JSON.stringify({ id }),
    });
  }

  // ===================
  // Video Methods
  // ===================

  /**
   * Upload a video
   */
  async uploadVideo(
    file: File | Blob,
    options: UploadOptions = {}
  ): Promise<VideoItem> {
    const formData = new FormData();
    formData.append("file", file);
    if (options.title) formData.append("title", options.title);
    if (options.metadata) {
      formData.append("metadata", JSON.stringify(options.metadata));
    }

    return this.request<VideoItem>("/api/v1/videos", {
      method: "POST",
      body: formData,
    });
  }

  /**
   * Get a video by ID
   */
  async getVideo(id: string): Promise<VideoItem> {
    return this.request<VideoItem>(`/api/v1/videos/${id}`);
  }

  /**
   * Delete a video
   */
  async deleteVideo(id: string): Promise<{ deleted: boolean }> {
    return this.request(`/api/v1/videos/${id}`, { method: "DELETE" });
  }

  // ===================
  // Image Methods
  // ===================

  /**
   * Upload an image
   */
  async uploadImage(
    file: File | Blob,
    options: UploadOptions & {
      preset?: "avatar" | "product" | "banner";
      format?: "webp" | "jpeg" | "png" | "avif";
    } = {}
  ): Promise<ImageItem> {
    const formData = new FormData();
    formData.append("file", file);
    if (options.title) formData.append("title", options.title);
    if (options.metadata) {
      formData.append("metadata", JSON.stringify(options.metadata));
    }
    if (options.preset) formData.append("preset", options.preset);
    if (options.format) formData.append("format", options.format);

    return this.request<ImageItem>("/api/v1/images", {
      method: "POST",
      body: formData,
    });
  }

  /**
   * Get an image by ID
   */
  async getImage(id: string): Promise<ImageItem> {
    return this.request<ImageItem>(`/api/v1/images/${id}`);
  }

  /**
   * Delete an image
   */
  async deleteImage(id: string): Promise<{ deleted: boolean }> {
    return this.request(`/api/v1/images/${id}`, { method: "DELETE" });
  }

  // ===================
  // Audio Methods
  // ===================

  /**
   * Upload audio
   */
  async uploadAudio(
    file: File | Blob,
    options: UploadOptions = {}
  ): Promise<AudioItem> {
    const formData = new FormData();
    formData.append("file", file);
    if (options.title) formData.append("title", options.title);
    if (options.metadata) {
      formData.append("metadata", JSON.stringify(options.metadata));
    }

    return this.request<AudioItem>("/api/v1/audio", {
      method: "POST",
      body: formData,
    });
  }

  /**
   * Get audio by ID
   */
  async getAudio(id: string): Promise<AudioItem> {
    return this.request<AudioItem>(`/api/v1/audio/${id}`);
  }

  /**
   * Delete audio
   */
  async deleteAudio(id: string): Promise<{ deleted: boolean }> {
    return this.request(`/api/v1/audio/${id}`, { method: "DELETE" });
  }

  // ===================
  // File Methods
  // ===================

  /**
   * Upload a file
   */
  async uploadFile(
    file: File | Blob,
    options: UploadOptions = {}
  ): Promise<FileItem> {
    const formData = new FormData();
    formData.append("file", file);
    if (options.title) formData.append("title", options.title);
    if (options.metadata) {
      formData.append("metadata", JSON.stringify(options.metadata));
    }
    if (options.public !== undefined) {
      formData.append("public", String(options.public));
    }

    return this.request<FileItem>("/api/v1/files", {
      method: "POST",
      body: formData,
    });
  }

  /**
   * Get a file by ID
   */
  async getFile(
    id: string,
    options: { download?: boolean; expires?: number } = {}
  ): Promise<FileItem> {
    const params = new URLSearchParams();
    if (options.download) params.append("download", "true");
    if (options.expires) params.append("expires", String(options.expires));

    const query = params.toString();
    return this.request<FileItem>(
      `/api/v1/files/${id}${query ? `?${query}` : ""}`
    );
  }

  /**
   * Delete a file
   */
  async deleteFile(id: string): Promise<{ deleted: boolean }> {
    return this.request(`/api/v1/files/${id}`, { method: "DELETE" });
  }

  // ===================
  // General Methods
  // ===================

  /**
   * List all media
   */
  async list(options: ListOptions = {}): Promise<{ items: MediaItem[] }> {
    const params = new URLSearchParams();
    if (options.type) params.append("type", options.type);
    if (options.status) params.append("status", options.status);
    if (options.limit) params.append("limit", String(options.limit));
    if (options.offset) params.append("offset", String(options.offset));
    if (options.metadata) {
      Object.entries(options.metadata).forEach(([key, value]) => {
        params.append(key, value);
      });
    }

    const query = params.toString();
    return this.request<{ items: MediaItem[] }>(
      `/api/v1/media${query ? `?${query}` : ""}`
    );
  }

  /**
   * Get a single media item by ID (auto-detects type)
   */
  async get(id: string): Promise<MediaItem> {
    // Try each endpoint until we find the media
    const endpoints = [
      "/api/v1/videos",
      "/api/v1/images",
      "/api/v1/audio",
      "/api/v1/files",
    ];

    for (const endpoint of endpoints) {
      try {
        return await this.request<MediaItem>(`${endpoint}/${id}`);
      } catch (e) {
        if ((e as OneStreamError).statusCode !== 404) throw e;
      }
    }

    throw new OneStreamError("Media not found", 404);
  }

  /**
   * Delete a media item by ID
   */
  async delete(id: string, type?: "video" | "image" | "audio" | "file"): Promise<{ deleted: boolean }> {
    if (type) {
      const endpoint = type === "audio" ? "/api/v1/audio" : `/api/v1/${type}s`;
      return this.request(`${endpoint}/${id}`, { method: "DELETE" });
    }

    // Try to find and delete
    const media = await this.get(id);
    return this.delete(id, media.type);
  }

  /**
   * Update media metadata
   */
  async update(
    id: string,
    updates: { title?: string; metadata?: Record<string, unknown> },
    type?: "video" | "image" | "audio" | "file"
  ): Promise<MediaItem> {
    const mediaType = type || (await this.get(id)).type;
    const endpoint =
      mediaType === "audio" ? "/api/v1/audio" : `/api/v1/${mediaType}s`;

    return this.request<MediaItem>(`${endpoint}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  }
}

// Default export for convenience
export default OneStream;

// Re-export error class
export { OneStreamError };
