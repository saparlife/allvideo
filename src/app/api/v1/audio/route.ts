import { NextRequest } from "next/server";
import { verifyApiKey, apiError, apiSuccess } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { r2Client, R2_BUCKET, R2_PUBLIC_URL } from "@/lib/r2/client";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { validateFile, sanitizeFilename, type SubscriptionTier } from "@/lib/validation/file";

/**
 * POST /api/v1/audio
 * Upload audio file
 *
 * Body (JSON):
 * - filename: string (required)
 * - size: number (required)
 * - title: string (optional)
 * - metadata: object (optional)
 *
 * Or multipart/form-data for direct upload
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

    const contentType = request.headers.get("content-type") || "";
    const supabase = createAdminClient();

    // Check storage
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: user, error: userError } = await (supabase as any)
      .from("users")
      .select("storage_limit_bytes, storage_used_bytes")
      .eq("id", auth.userId)
      .single();

    if (userError || !user) {
      return apiError("User not found", 404);
    }

    // Get subscription tier
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: subscription } = await (supabase as any)
      .from("subscriptions")
      .select("tier")
      .eq("user_id", auth.userId)
      .eq("is_active", true)
      .single();

    const tier = (subscription?.tier || "free") as SubscriptionTier;

    // Handle multipart (direct upload)
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const title = formData.get("title") as string | null;
      const metadataStr = formData.get("metadata") as string | null;

      if (!file) {
        return apiError("No file provided", 400);
      }

      // Validate file
      const validation = validateFile(file.name, file.size, tier);
      if (!validation.valid) {
        return apiError(validation.error!, 400);
      }
      const safeName = validation.sanitizedFilename!;

      if (user.storage_used_bytes + file.size > user.storage_limit_bytes) {
        return apiError("Storage limit exceeded", 403);
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const metadata = metadataStr ? JSON.parse(metadataStr) : {};

      // Create record
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: audio, error: audioError } = await (supabase as any)
        .from("videos")
        .insert({
          user_id: auth.userId,
          title: title || safeName,
          original_filename: safeName,
          original_size_bytes: file.size,
          mime_type: file.type,
          media_type: "audio",
          custom_metadata: metadata,
          status: "processing",
        })
        .select()
        .single();

      if (audioError || !audio) {
        return apiError("Failed to create audio record", 500);
      }

      // Upload to R2
      const key = `users/${auth.userId}/audio/${audio.id}/original_${safeName}`;
      await r2Client.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET,
          Key: key,
          Body: buffer,
          ContentType: file.type,
        })
      );

      // Update record
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("videos")
        .update({
          original_key: key,
          status: "ready",
          uploaded_at: new Date().toISOString(),
          processed_at: new Date().toISOString(),
        })
        .eq("id", audio.id);

      return apiSuccess({
        id: audio.id,
        type: "audio",
        status: "ready",
        url: `${R2_PUBLIC_URL}/${key}`,
        streamUrl: `${R2_PUBLIC_URL}/${key}`,
        size: file.size,
        mimeType: file.type,
        metadata: metadata,
      });
    }

    // Handle JSON (presigned URL flow)
    const body = await request.json();
    const { filename, size, title, metadata } = body;

    if (!filename || !size) {
      return apiError("Missing required fields: filename, size", 400);
    }

    // Validate file
    const validation = validateFile(filename, size, tier);
    if (!validation.valid) {
      return apiError(validation.error!, 400);
    }
    const safeName = validation.sanitizedFilename!;

    if (user.storage_used_bytes + size > user.storage_limit_bytes) {
      return apiError("Storage limit exceeded", 403);
    }

    const mimeType = guessMimeType(safeName);

    // Create record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: audio, error: audioError } = await (supabase as any)
      .from("videos")
      .insert({
        user_id: auth.userId,
        title: title || safeName,
        original_filename: safeName,
        original_size_bytes: size,
        mime_type: mimeType,
        media_type: "audio",
        custom_metadata: metadata || {},
        status: "uploading",
      })
      .select()
      .single();

    if (audioError || !audio) {
      return apiError("Failed to create audio record", 500);
    }

    // Generate presigned URL
    const key = `users/${auth.userId}/audio/${audio.id}/original_${safeName}`;
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("videos")
      .update({ original_key: key })
      .eq("id", audio.id);

    return apiSuccess({
      id: audio.id,
      type: "audio",
      uploadUrl,
      expiresIn: 3600,
      metadata: metadata || {},
    });
  } catch (error) {
    console.error("Audio API error:", error);
    return apiError("Internal server error", 500);
  }
}

/**
 * GET /api/v1/audio
 * List all audio files
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyApiKey(request);
    if (!auth) {
      return apiError("Invalid or missing API key", 401);
    }

    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
    const offset = parseInt(url.searchParams.get("offset") || "0");

    const supabase = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: audioFiles, error } = await (supabase as any)
      .from("videos")
      .select("id, title, status, duration_seconds, original_size_bytes, mime_type, custom_metadata, created_at, original_key")
      .eq("user_id", auth.userId)
      .eq("media_type", "audio")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return apiError("Failed to fetch audio", 500);
    }

    const result = (audioFiles || []).map((a: {
      id: string;
      title: string;
      status: string;
      duration_seconds: number | null;
      original_size_bytes: number;
      mime_type: string;
      custom_metadata: Record<string, unknown>;
      created_at: string;
      original_key: string;
    }) => ({
      id: a.id,
      type: "audio",
      title: a.title,
      status: a.status,
      duration: a.duration_seconds,
      size: a.original_size_bytes,
      mimeType: a.mime_type,
      metadata: a.custom_metadata || {},
      url: a.original_key ? `${R2_PUBLIC_URL}/${a.original_key}` : null,
      createdAt: a.created_at,
    }));

    return apiSuccess({
      audio: result,
      pagination: { limit, offset, hasMore: result.length === limit },
    });
  } catch (error) {
    console.error("Audio API error:", error);
    return apiError("Internal server error", 500);
  }
}

function guessMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const types: Record<string, string> = {
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    m4a: "audio/mp4",
    flac: "audio/flac",
    aac: "audio/aac",
    wma: "audio/x-ms-wma",
  };
  return types[ext || ""] || "audio/mpeg";
}
