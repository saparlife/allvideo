import { NextRequest } from "next/server";
import { verifyApiKey, apiError, apiSuccess } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { R2_PUBLIC_URL } from "@/lib/r2/client";

/**
 * Build a proper URL from R2 key, encoding special characters
 */
function buildMediaUrl(key: string | null): string | null {
  if (!key) return null;
  // Clean the key - remove any newlines or control characters
  const cleanKey = key.replace(/[\r\n\x00-\x1f]/g, "").trim();
  // Encode each path segment separately to handle spaces and special chars
  const encodedPath = cleanKey
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${R2_PUBLIC_URL}/${encodedPath}`;
}

/**
 * GET /api/v1/media
 * List all media (videos, images, audio, files) with filtering
 *
 * Query params:
 * - type: filter by type (video, image, audio, file)
 * - status: filter by status (uploading, processing, ready, failed)
 * - limit: number of results (default 50, max 100)
 * - offset: pagination offset
 * - Any custom metadata key to filter by (e.g., ?companyId=abc&userId=123)
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyApiKey(request);
    if (!auth) {
      return apiError("Invalid or missing API key", 401);
    }

    if (!auth.permissions.read) {
      return apiError("API key does not have read permission", 403);
    }

    const url = new URL(request.url);
    const type = url.searchParams.get("type");
    const status = url.searchParams.get("status");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
    const offset = parseInt(url.searchParams.get("offset") || "0");

    // Get metadata filters (any param that's not a known param)
    const knownParams = ["type", "status", "limit", "offset"];
    const metadataFilters: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      if (!knownParams.includes(key)) {
        metadataFilters[key] = value;
      }
    });

    const supabase = createAdminClient();

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from("videos")
      .select("id, title, status, media_type, duration_seconds, width, height, original_size_bytes, mime_type, views_count, custom_metadata, created_at, hls_key, thumbnail_key, original_key")
      .eq("user_id", auth.userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (type) {
      query = query.eq("media_type", type);
    }

    if (status) {
      query = query.eq("status", status);
    }

    // Apply metadata filters using containedBy
    if (Object.keys(metadataFilters).length > 0) {
      query = query.contains("custom_metadata", metadataFilters);
    }

    const { data: media, error } = await query;

    if (error) {
      console.error("Media query error:", error);
      return apiError("Failed to fetch media", 500);
    }

    // Transform to API response format
    const result = (media || []).map((m: {
      id: string;
      title: string;
      status: string;
      media_type: string;
      duration_seconds: number | null;
      width: number | null;
      height: number | null;
      original_size_bytes: number;
      mime_type: string;
      views_count: number;
      custom_metadata: Record<string, unknown>;
      created_at: string;
      hls_key: string | null;
      thumbnail_key: string | null;
      original_key: string | null;
    }) => {
      const mediaType = m.media_type || "video";
      const base = {
        id: m.id,
        type: mediaType,
        title: m.title,
        status: m.status,
        size: m.original_size_bytes,
        mimeType: m.mime_type,
        metadata: m.custom_metadata || {},
        createdAt: m.created_at,
      };

      // Add type-specific fields
      if (mediaType === "video") {
        return {
          ...base,
          duration: m.duration_seconds,
          resolution: m.width && m.height ? `${m.width}x${m.height}` : null,
          views: m.views_count,
          hlsUrl: buildMediaUrl(m.hls_key),
          thumbnailUrl: buildMediaUrl(m.thumbnail_key),
        };
      }

      if (mediaType === "image") {
        return {
          ...base,
          width: m.width,
          height: m.height,
          url: buildMediaUrl(m.original_key),
          thumbnailUrl: buildMediaUrl(m.thumbnail_key),
        };
      }

      if (mediaType === "audio") {
        return {
          ...base,
          duration: m.duration_seconds,
          url: buildMediaUrl(m.original_key),
        };
      }

      // File type
      return {
        ...base,
        url: buildMediaUrl(m.original_key),
      };
    });

    return apiSuccess({
      media: result,
      pagination: {
        limit,
        offset,
        hasMore: result.length === limit,
      },
      filters: {
        type: type || "all",
        status: status || "all",
        metadata: metadataFilters,
      },
    });
  } catch (error) {
    console.error("Media API error:", error);
    return apiError("Internal server error", 500);
  }
}
