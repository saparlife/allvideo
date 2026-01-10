import { NextRequest } from "next/server";
import { verifyApiKey, apiError, apiSuccess } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { r2Client, R2_BUCKET, R2_PUBLIC_URL, fixVariantUrls } from "@/lib/r2/client";
import { DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

/**
 * GET /api/v1/media/:id
 * Get any media item by ID (video, image, audio, file)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyApiKey(request);
    if (!auth) {
      return apiError("Invalid or missing API key", 401);
    }

    if (!auth.permissions.read) {
      return apiError("API key does not have read permission", 403);
    }

    const { id } = await params;
    const supabase = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: media, error } = await (supabase as any)
      .from("videos")
      .select("*")
      .eq("id", id)
      .eq("user_id", auth.userId)
      .single();

    if (error || !media) {
      return apiError("Media not found", 404);
    }

    const mediaType = media.media_type || "video";

    // Base response
    const base = {
      id: media.id,
      type: mediaType,
      title: media.title,
      status: media.status,
      size: media.original_size_bytes,
      mimeType: media.mime_type,
      metadata: media.custom_metadata || {},
      createdAt: media.created_at,
    };

    // Add type-specific fields
    if (mediaType === "video") {
      return apiSuccess({
        ...base,
        duration: media.duration_seconds,
        resolution: media.width && media.height ? `${media.width}x${media.height}` : null,
        views: media.views_count,
        hlsUrl: media.hls_key ? `${R2_PUBLIC_URL}/${media.hls_key}` : null,
        thumbnailUrl: media.thumbnail_key ? `${R2_PUBLIC_URL}/${media.thumbnail_key}` : null,
      });
    }

    if (mediaType === "image") {
      return apiSuccess({
        ...base,
        width: media.width,
        height: media.height,
        url: media.original_key ? `${R2_PUBLIC_URL}/${media.original_key}` : null,
        variants: fixVariantUrls((media.custom_metadata as { variants?: Record<string, { url: string }> })?.variants),
      });
    }

    if (mediaType === "audio") {
      return apiSuccess({
        ...base,
        duration: media.duration_seconds,
        url: media.original_key ? `${R2_PUBLIC_URL}/${media.original_key}` : null,
      });
    }

    // File type
    return apiSuccess({
      ...base,
      url: media.original_key ? `${R2_PUBLIC_URL}/${media.original_key}` : null,
    });
  } catch (error) {
    console.error("Media GET error:", error);
    return apiError("Internal server error", 500);
  }
}

/**
 * DELETE /api/v1/media/:id
 * Delete any media item by ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyApiKey(request);
    if (!auth) {
      return apiError("Invalid or missing API key", 401);
    }

    if (!auth.permissions.delete) {
      return apiError("API key does not have delete permission", 403);
    }

    const { id } = await params;
    const supabase = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: media, error } = await (supabase as any)
      .from("videos")
      .select("*")
      .eq("id", id)
      .eq("user_id", auth.userId)
      .single();

    if (error || !media) {
      return apiError("Media not found", 404);
    }

    const mediaType = media.media_type || "video";

    // Delete files from R2 based on media type
    try {
      let prefix: string;
      if (mediaType === "video") {
        // Delete both originals and HLS files
        prefix = `users/${auth.userId}/originals/${id}`;
        await deleteR2Prefix(prefix);
        prefix = `users/${auth.userId}/hls/${id}`;
        await deleteR2Prefix(prefix);
      } else if (mediaType === "image") {
        prefix = `users/${auth.userId}/images/${id}`;
        await deleteR2Prefix(prefix);
        // Also delete original
        prefix = `users/${auth.userId}/originals/${id}`;
        await deleteR2Prefix(prefix);
      } else {
        // Audio and file
        prefix = `users/${auth.userId}/originals/${id}`;
        await deleteR2Prefix(prefix);
      }
    } catch (r2Error) {
      console.error("R2 deletion error:", r2Error);
      // Continue with DB deletion even if R2 fails
    }

    // Update storage used
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).rpc("decrement_storage", {
      user_id: auth.userId,
      bytes: media.original_size_bytes || 0,
    });

    // Delete from database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("videos")
      .delete()
      .eq("id", id);

    return apiSuccess({ deleted: true, id });
  } catch (error) {
    console.error("Media DELETE error:", error);
    return apiError("Internal server error", 500);
  }
}

// Helper to delete all objects with a prefix
async function deleteR2Prefix(prefix: string) {
  const listCommand = new ListObjectsV2Command({
    Bucket: R2_BUCKET,
    Prefix: prefix,
  });
  const listResult = await r2Client.send(listCommand);

  if (listResult.Contents) {
    for (const object of listResult.Contents) {
      await r2Client.send(
        new DeleteObjectCommand({
          Bucket: R2_BUCKET,
          Key: object.Key!,
        })
      );
    }
  }
}
