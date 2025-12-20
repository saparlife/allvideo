import { NextRequest } from "next/server";
import { verifyApiKey, apiError } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { r2Client, R2_BUCKET } from "@/lib/r2/client";
import { DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

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
    const supabase = await createAdminClient();

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

    return Response.json({
      id: video.id,
      title: video.title,
      status: video.status,
      duration: video.duration_seconds,
      thumbnail: video.thumbnail_url,
      hls: video.hls_url,
      createdAt: video.created_at,
    });
  } catch (error) {
    console.error("API error:", error);
    return apiError("Internal server error", 500);
  }
}

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
    const supabase = await createAdminClient();

    // Get video to verify ownership and get keys
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
      // Continue with database deletion even if R2 fails
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

    return Response.json({ success: true });
  } catch (error) {
    console.error("API error:", error);
    return apiError("Internal server error", 500);
  }
}
