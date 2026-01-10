import { NextRequest } from "next/server";
import { verifyApiKey, apiError, apiSuccess } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { r2Client, R2_BUCKET } from "@/lib/r2/client";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { validateFile, type SubscriptionTier } from "@/lib/validation/file";

// Detect media type from mime type
function detectMediaType(mimeType: string): "video" | "image" | "audio" | "file" {
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("audio/")) return "audio";
  return "file";
}

/**
 * POST /api/v1/upload
 * Universal upload endpoint - auto-detects media type
 *
 * Body:
 * - filename: string (required)
 * - size: number (required)
 * - mimeType: string (optional, will be guessed from filename)
 * - title: string (optional, defaults to filename)
 * - metadata: object (optional, custom user data)
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
    const { filename, size, mimeType, title, metadata } = body;

    if (!filename || !size) {
      return apiError("Missing required fields: filename, size", 400);
    }

    // Determine mime type
    const detectedMimeType = mimeType || guessMimeType(filename);
    const mediaType = detectMediaType(detectedMimeType);

    const supabase = createAdminClient();

    // Get user with subscription tier
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

    // Validate file (size limit and sanitize filename)
    const validation = validateFile(filename, size, tier);
    if (!validation.valid) {
      return apiError(validation.error!, 400);
    }
    const sanitizedFilename = validation.sanitizedFilename!;

    // Check storage limit
    if (user.storage_used_bytes + size > user.storage_limit_bytes) {
      return apiError("Storage limit exceeded. Upgrade your plan for more storage.", 403);
    }

    // Create media record (using videos table for now)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: media, error: mediaError } = await (supabase as any)
      .from("videos")
      .insert({
        user_id: auth.userId,
        title: title || sanitizedFilename,
        original_filename: sanitizedFilename,
        original_size_bytes: size,
        mime_type: detectedMimeType,
        media_type: mediaType,
        custom_metadata: metadata || {},
        status: "uploading",
      })
      .select()
      .single();

    if (mediaError || !media) {
      console.error("Failed to create media record:", mediaError);
      return apiError("Failed to create media record", 500);
    }

    // Generate presigned URL for upload
    const key = `users/${auth.userId}/originals/${media.id}/${sanitizedFilename}`;
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: detectedMimeType,
    });

    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });

    // Update media with original_key
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("videos")
      .update({ original_key: key })
      .eq("id", media.id);

    return apiSuccess({
      id: media.id,
      type: mediaType,
      uploadUrl,
      expiresIn: 3600,
      metadata: metadata || {},
    });
  } catch (error) {
    console.error("Upload API error:", error);
    return apiError("Internal server error", 500);
  }
}

// Simple mime type guesser based on file extension
function guessMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    // Video
    mp4: "video/mp4",
    webm: "video/webm",
    mov: "video/quicktime",
    avi: "video/x-msvideo",
    mkv: "video/x-matroska",
    // Image
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    // Audio
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    m4a: "audio/mp4",
    flac: "audio/flac",
    // Documents
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
  return mimeTypes[ext || ""] || "application/octet-stream";
}
