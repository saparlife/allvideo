import { NextRequest } from "next/server";
import { verifyApiKey, apiError, apiSuccess } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { r2Client, R2_BUCKET, R2_PUBLIC_URL } from "@/lib/r2/client";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * POST /api/v1/videos
 * Upload a new video
 *
 * Body:
 * - filename: string (required)
 * - size: number (required)
 * - title: string (optional)
 * - metadata: object (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyApiKey(request);
    if (!auth) {
      return apiError("Invalid or missing API key", 401);
    }

    if (!auth.permissions.write) {
      return apiError("API key does not have write permission", 403);
    }

    const body = await request.json();
    const { filename, size, title, metadata } = body;

    if (!filename || !size) {
      return apiError("Missing required fields: filename, size", 400);
    }

    const supabase = createAdminClient();

    // Check storage limit
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: user, error: userError } = await (supabase as any)
      .from("users")
      .select("storage_limit_bytes, storage_used_bytes")
      .eq("id", auth.userId)
      .single();

    if (userError || !user) {
      return apiError("User not found", 404);
    }

    if (user.storage_used_bytes + size > user.storage_limit_bytes) {
      return apiError("Storage limit exceeded", 403);
    }

    // Create video record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: video, error: videoError } = await (supabase as any)
      .from("videos")
      .insert({
        user_id: auth.userId,
        title: title || filename,
        original_filename: filename,
        original_size_bytes: size,
        mime_type: "video/*",
        media_type: "video",
        custom_metadata: metadata || {},
        status: "uploading",
      })
      .select()
      .single();

    if (videoError || !video) {
      return apiError("Failed to create video record", 500);
    }

    // Generate presigned URL
    const key = `users/${auth.userId}/originals/${video.id}/${filename}`;
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: "video/*",
    });

    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });

    // Update with key
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("videos")
      .update({ original_key: key })
      .eq("id", video.id);

    return apiSuccess({
      id: video.id,
      type: "video",
      uploadUrl,
      expiresIn: 3600,
      metadata: metadata || {},
    });
  } catch (error) {
    console.error("Videos API error:", error);
    return apiError("Internal server error", 500);
  }
}

/**
 * GET /api/v1/videos
 * List all videos for the authenticated user
 *
 * Query params:
 * - status: filter by status (uploading, processing, ready, failed)
 * - limit: number of results (default 50, max 100)
 * - offset: pagination offset
 * - Any custom metadata key to filter by
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
    const status = url.searchParams.get("status");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
    const offset = parseInt(url.searchParams.get("offset") || "0");

    const supabase = createAdminClient();

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from("videos")
      .select("id, title, status, duration_seconds, width, height, views_count, custom_metadata, created_at, hls_key, thumbnail_key")
      .eq("user_id", auth.userId)
      .eq("media_type", "video")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    const { data: videos, error } = await query;

    if (error) {
      return apiError("Failed to fetch videos", 500);
    }

    // Transform to API response format
    const result = (videos || []).map((v: {
      id: string;
      title: string;
      status: string;
      duration_seconds: number | null;
      width: number | null;
      height: number | null;
      views_count: number;
      custom_metadata: Record<string, unknown>;
      created_at: string;
      hls_key: string | null;
      thumbnail_key: string | null;
    }) => ({
      id: v.id,
      title: v.title,
      status: v.status,
      duration: v.duration_seconds,
      resolution: v.width && v.height ? `${v.width}x${v.height}` : null,
      views: v.views_count,
      metadata: v.custom_metadata || {},
      createdAt: v.created_at,
      hlsUrl: v.hls_key ? `${R2_PUBLIC_URL}/${v.hls_key}` : null,
      thumbnailUrl: v.thumbnail_key ? `${R2_PUBLIC_URL}/${v.thumbnail_key}` : null,
    }));

    return apiSuccess({
      videos: result,
      pagination: {
        limit,
        offset,
        hasMore: result.length === limit,
      },
    });
  } catch (error) {
    console.error("Videos API error:", error);
    return apiError("Internal server error", 500);
  }
}
