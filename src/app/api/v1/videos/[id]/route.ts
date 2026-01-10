import { NextRequest } from "next/server";
import { verifyApiKey, apiError, apiSuccess } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { r2Client, R2_BUCKET, R2_PUBLIC_URL } from "@/lib/r2/client";
import { DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

/**
 * GET /api/v1/videos/:id
 * Get a specific video by ID
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
    const { data: video, error } = await (supabase as any)
      .from("videos")
      .select("*")
      .eq("id", id)
      .eq("user_id", auth.userId)
      .single();

    if (error || !video) {
      return apiError("Video not found", 404);
    }

    return apiSuccess({
      id: video.id,
      type: "video",
      title: video.title,
      status: video.status,
      duration: video.duration_seconds,
      resolution: video.width && video.height ? `${video.width}x${video.height}` : null,
      size: video.original_size_bytes,
      views: video.views_count,
      metadata: video.custom_metadata || {},
      hlsUrl: video.hls_key ? `${R2_PUBLIC_URL}/${video.hls_key}` : null,
      thumbnailUrl: video.thumbnail_key ? `${R2_PUBLIC_URL}/${video.thumbnail_key}` : null,
      createdAt: video.created_at,
      processedAt: video.processed_at,
    });
  } catch (error) {
    console.error("Video GET API error:", error);
    return apiError("Internal server error", 500);
  }
}

/**
 * PATCH /api/v1/videos/:id
 * Update video metadata
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyApiKey(request);
    if (!auth) {
      return apiError("Invalid or missing API key", 401);
    }

    if (!auth.permissions.write) {
      return apiError("API key does not have write permission", 403);
    }

    const { id } = await params;
    const body = await request.json();
    const { title, metadata } = body;

    const supabase = createAdminClient();

    // Verify ownership
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing, error: findError } = await (supabase as any)
      .from("videos")
      .select("id")
      .eq("id", id)
      .eq("user_id", auth.userId)
      .single();

    if (findError || !existing) {
      return apiError("Video not found", 404);
    }

    // Build update object
    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (metadata !== undefined) updates.custom_metadata = metadata;

    if (Object.keys(updates).length === 0) {
      return apiError("No fields to update", 400);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: video, error } = await (supabase as any)
      .from("videos")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return apiError("Failed to update video", 500);
    }

    return apiSuccess({
      id: video.id,
      title: video.title,
      metadata: video.custom_metadata || {},
      updatedAt: video.updated_at,
    });
  } catch (error) {
    console.error("Video PATCH API error:", error);
    return apiError("Internal server error", 500);
  }
}

/**
 * DELETE /api/v1/videos/:id
 * Delete a video and all its files
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

    // Get video
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: video, error } = await (supabase as any)
      .from("videos")
      .select("*")
      .eq("id", id)
      .eq("user_id", auth.userId)
      .single();

    if (error || !video) {
      return apiError("Video not found", 404);
    }

    // Delete files from R2
    try {
      // Delete original
      if (video.original_key) {
        await r2Client.send(
          new DeleteObjectCommand({
            Bucket: R2_BUCKET,
            Key: video.original_key,
          })
        );
      }

      // Delete HLS folder
      if (video.hls_key) {
        const prefix = video.hls_key.replace("/master.m3u8", "");
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

      // Delete thumbnails
      const thumbnailPrefix = `users/${auth.userId}/thumbnails/${id}`;
      const thumbListCommand = new ListObjectsV2Command({
        Bucket: R2_BUCKET,
        Prefix: thumbnailPrefix,
      });
      const thumbResult = await r2Client.send(thumbListCommand);

      if (thumbResult.Contents) {
        for (const object of thumbResult.Contents) {
          await r2Client.send(
            new DeleteObjectCommand({
              Bucket: R2_BUCKET,
              Key: object.Key!,
            })
          );
        }
      }
    } catch (r2Error) {
      console.error("R2 deletion error:", r2Error);
    }

    // Delete from database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (supabase as any)
      .from("videos")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return apiError("Failed to delete video", 500);
    }

    return apiSuccess({ deleted: true, id });
  } catch (error) {
    console.error("Video DELETE API error:", error);
    return apiError("Internal server error", 500);
  }
}
