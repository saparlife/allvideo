import { NextRequest } from "next/server";
import { verifyApiKey, apiError, apiSuccess } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { r2Client, R2_BUCKET, R2_PUBLIC_URL } from "@/lib/r2/client";
import { DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

/**
 * GET /api/v1/audio/:id
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

    const { id } = await params;
    const supabase = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: audio, error } = await (supabase as any)
      .from("videos")
      .select("*")
      .eq("id", id)
      .eq("user_id", auth.userId)
      .eq("media_type", "audio")
      .single();

    if (error || !audio) {
      return apiError("Audio not found", 404);
    }

    return apiSuccess({
      id: audio.id,
      type: "audio",
      title: audio.title,
      status: audio.status,
      duration: audio.duration_seconds,
      size: audio.original_size_bytes,
      mimeType: audio.mime_type,
      url: audio.original_key ? `${R2_PUBLIC_URL}/${audio.original_key}` : null,
      streamUrl: audio.original_key ? `${R2_PUBLIC_URL}/${audio.original_key}` : null,
      metadata: audio.custom_metadata || {},
      waveform: (audio.custom_metadata as { waveform?: number[] })?.waveform || null,
      createdAt: audio.created_at,
    });
  } catch (error) {
    console.error("Audio GET error:", error);
    return apiError("Internal server error", 500);
  }
}

/**
 * PATCH /api/v1/audio/:id
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing, error: findError } = await (supabase as any)
      .from("videos")
      .select("id, custom_metadata")
      .eq("id", id)
      .eq("user_id", auth.userId)
      .eq("media_type", "audio")
      .single();

    if (findError || !existing) {
      return apiError("Audio not found", 404);
    }

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (metadata !== undefined) {
      updates.custom_metadata = {
        ...existing.custom_metadata,
        ...metadata,
      };
    }

    if (Object.keys(updates).length === 0) {
      return apiError("No fields to update", 400);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: audio, error } = await (supabase as any)
      .from("videos")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return apiError("Failed to update audio", 500);
    }

    return apiSuccess({
      id: audio.id,
      title: audio.title,
      metadata: audio.custom_metadata,
      updatedAt: audio.updated_at,
    });
  } catch (error) {
    console.error("Audio PATCH error:", error);
    return apiError("Internal server error", 500);
  }
}

/**
 * DELETE /api/v1/audio/:id
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
    const { data: audio, error } = await (supabase as any)
      .from("videos")
      .select("*")
      .eq("id", id)
      .eq("user_id", auth.userId)
      .eq("media_type", "audio")
      .single();

    if (error || !audio) {
      return apiError("Audio not found", 404);
    }

    // Delete from R2
    try {
      const prefix = `users/${auth.userId}/audio/${id}`;
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
    } catch (r2Error) {
      console.error("R2 deletion error:", r2Error);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("videos")
      .delete()
      .eq("id", id);

    return apiSuccess({ deleted: true, id });
  } catch (error) {
    console.error("Audio DELETE error:", error);
    return apiError("Internal server error", 500);
  }
}

/**
 * POST /api/v1/audio/:id
 * Mark upload complete (for presigned URL flow)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyApiKey(request);
    if (!auth) {
      return apiError("Invalid or missing API key", 401);
    }

    const { id } = await params;
    const supabase = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: audio, error } = await (supabase as any)
      .from("videos")
      .select("*")
      .eq("id", id)
      .eq("user_id", auth.userId)
      .eq("media_type", "audio")
      .single();

    if (error || !audio) {
      return apiError("Audio not found", 404);
    }

    if (audio.status !== "uploading") {
      return apiError("Audio is not in uploading state", 400);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("videos")
      .update({
        status: "ready",
        uploaded_at: new Date().toISOString(),
        processed_at: new Date().toISOString(),
      })
      .eq("id", id);

    return apiSuccess({
      id: audio.id,
      type: "audio",
      status: "ready",
      url: audio.original_key ? `${R2_PUBLIC_URL}/${audio.original_key}` : null,
      metadata: audio.custom_metadata || {},
    });
  } catch (error) {
    console.error("Audio complete error:", error);
    return apiError("Internal server error", 500);
  }
}
