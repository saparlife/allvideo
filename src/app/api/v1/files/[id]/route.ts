import { NextRequest } from "next/server";
import { verifyApiKey, apiError, apiSuccess } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { r2Client, R2_BUCKET, R2_PUBLIC_URL } from "@/lib/r2/client";
import { DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * GET /api/v1/files/:id
 * Get file info and generate signed URL if needed
 *
 * Query params:
 * - download: if true, generate a signed download URL
 * - expires: expiration in seconds (default: 3600)
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
    const url = new URL(request.url);
    const needsDownloadUrl = url.searchParams.get("download") === "true";
    const expires = parseInt(url.searchParams.get("expires") || "3600");

    const supabase = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: file, error } = await (supabase as any)
      .from("videos")
      .select("*")
      .eq("id", id)
      .eq("user_id", auth.userId)
      .eq("media_type", "file")
      .single();

    if (error || !file) {
      return apiError("File not found", 404);
    }

    let signedUrl = null;
    if ((needsDownloadUrl || file.is_public === false) && file.original_key) {
      const getCommand = new GetObjectCommand({
        Bucket: R2_BUCKET,
        Key: file.original_key,
        ResponseContentDisposition: `attachment; filename="${file.original_filename}"`,
      });
      signedUrl = await getSignedUrl(r2Client, getCommand, { expiresIn: Math.min(expires, 86400) });
    }

    return apiSuccess({
      id: file.id,
      type: "file",
      title: file.title,
      filename: file.original_filename,
      status: file.status,
      size: file.original_size_bytes,
      mimeType: file.mime_type,
      public: file.is_public !== false,
      url: file.is_public !== false && file.original_key ? `${R2_PUBLIC_URL}/${file.original_key}` : null,
      signedUrl: signedUrl,
      downloadUrl: signedUrl,
      metadata: file.custom_metadata || {},
      createdAt: file.created_at,
    });
  } catch (error) {
    console.error("File GET error:", error);
    return apiError("Internal server error", 500);
  }
}

/**
 * PATCH /api/v1/files/:id
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
      .eq("media_type", "file")
      .single();

    if (findError || !existing) {
      return apiError("File not found", 404);
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
    const { data: file, error } = await (supabase as any)
      .from("videos")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return apiError("Failed to update file", 500);
    }

    return apiSuccess({
      id: file.id,
      title: file.title,
      metadata: file.custom_metadata,
      updatedAt: file.updated_at,
    });
  } catch (error) {
    console.error("File PATCH error:", error);
    return apiError("Internal server error", 500);
  }
}

/**
 * DELETE /api/v1/files/:id
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
    const { data: file, error } = await (supabase as any)
      .from("videos")
      .select("*")
      .eq("id", id)
      .eq("user_id", auth.userId)
      .eq("media_type", "file")
      .single();

    if (error || !file) {
      return apiError("File not found", 404);
    }

    // Delete from R2
    try {
      const prefix = `users/${auth.userId}/files/${id}`;
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
    console.error("File DELETE error:", error);
    return apiError("Internal server error", 500);
  }
}

/**
 * POST /api/v1/files/:id
 * Mark upload complete
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
    const { data: file, error } = await (supabase as any)
      .from("videos")
      .select("*")
      .eq("id", id)
      .eq("user_id", auth.userId)
      .eq("media_type", "file")
      .single();

    if (error || !file) {
      return apiError("File not found", 404);
    }

    if (file.status !== "uploading") {
      return apiError("File is not in uploading state", 400);
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

    const isPublic = file.is_public !== false;

    return apiSuccess({
      id: file.id,
      type: "file",
      status: "ready",
      filename: file.original_filename,
      url: isPublic && file.original_key ? `${R2_PUBLIC_URL}/${file.original_key}` : null,
      public: isPublic,
      metadata: file.custom_metadata || {},
    });
  } catch (error) {
    console.error("File complete error:", error);
    return apiError("Internal server error", 500);
  }
}
