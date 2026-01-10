import { NextRequest } from "next/server";
import { verifyApiKey, apiError, apiSuccess } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { r2Client, R2_BUCKET, R2_PUBLIC_URL } from "@/lib/r2/client";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { validateFile, type SubscriptionTier } from "@/lib/validation/file";

/**
 * POST /api/v1/files
 * Upload any file
 *
 * Query params:
 * - public: true/false (default: true) - if false, requires signed URL to access
 * - expires: expiration for signed URL in seconds (default: 3600)
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
    const url = new URL(request.url);
    const isPublic = url.searchParams.get("public") !== "false";

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
      const { data: fileRecord, error: fileError } = await (supabase as any)
        .from("videos")
        .insert({
          user_id: auth.userId,
          title: title || safeName,
          original_filename: safeName,
          original_size_bytes: file.size,
          mime_type: file.type || "application/octet-stream",
          media_type: "file",
          is_public: isPublic,
          custom_metadata: metadata,
          status: "processing",
        })
        .select()
        .single();

      if (fileError || !fileRecord) {
        return apiError("Failed to create file record", 500);
      }

      // Upload to R2
      const key = `users/${auth.userId}/files/${fileRecord.id}/${safeName}`;
      await r2Client.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET,
          Key: key,
          Body: buffer,
          ContentType: file.type || "application/octet-stream",
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
        .eq("id", fileRecord.id);

      // Generate URLs
      const publicUrl = `${R2_PUBLIC_URL}/${key}`;
      let signedUrl = null;

      if (!isPublic) {
        const getCommand = new GetObjectCommand({
          Bucket: R2_BUCKET,
          Key: key,
        });
        signedUrl = await getSignedUrl(r2Client, getCommand, { expiresIn: 3600 });
      }

      return apiSuccess({
        id: fileRecord.id,
        type: "file",
        status: "ready",
        filename: file.name,
        size: file.size,
        mimeType: file.type,
        url: isPublic ? publicUrl : null,
        signedUrl: signedUrl,
        public: isPublic,
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
    const { data: fileRecord, error: fileError } = await (supabase as any)
      .from("videos")
      .insert({
        user_id: auth.userId,
        title: title || safeName,
        original_filename: safeName,
        original_size_bytes: size,
        mime_type: mimeType,
        media_type: "file",
        is_public: isPublic,
        custom_metadata: metadata || {},
        status: "uploading",
      })
      .select()
      .single();

    if (fileError || !fileRecord) {
      return apiError("Failed to create file record", 500);
    }

    // Generate presigned upload URL
    const key = `users/${auth.userId}/files/${fileRecord.id}/${safeName}`;
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
      .eq("id", fileRecord.id);

    return apiSuccess({
      id: fileRecord.id,
      type: "file",
      uploadUrl,
      expiresIn: 3600,
      public: isPublic,
      metadata: metadata || {},
    });
  } catch (error) {
    console.error("Files API error:", error);
    return apiError("Internal server error", 500);
  }
}

/**
 * GET /api/v1/files
 * List all files
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
    const { data: files, error } = await (supabase as any)
      .from("videos")
      .select("id, title, status, original_filename, original_size_bytes, mime_type, is_public, custom_metadata, created_at, original_key")
      .eq("user_id", auth.userId)
      .eq("media_type", "file")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return apiError("Failed to fetch files", 500);
    }

    const result = (files || []).map((f: {
      id: string;
      title: string;
      status: string;
      original_filename: string;
      original_size_bytes: number;
      mime_type: string;
      is_public: boolean;
      custom_metadata: Record<string, unknown>;
      created_at: string;
      original_key: string;
    }) => ({
      id: f.id,
      type: "file",
      title: f.title,
      filename: f.original_filename,
      status: f.status,
      size: f.original_size_bytes,
      mimeType: f.mime_type,
      public: f.is_public !== false,
      metadata: f.custom_metadata || {},
      url: f.is_public !== false && f.original_key ? `${R2_PUBLIC_URL}/${f.original_key}` : null,
      createdAt: f.created_at,
    }));

    return apiSuccess({
      files: result,
      pagination: { limit, offset, hasMore: result.length === limit },
    });
  } catch (error) {
    console.error("Files API error:", error);
    return apiError("Internal server error", 500);
  }
}

function guessMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const types: Record<string, string> = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    txt: "text/plain",
    csv: "text/csv",
    json: "application/json",
    xml: "application/xml",
    zip: "application/zip",
    rar: "application/x-rar-compressed",
    "7z": "application/x-7z-compressed",
    tar: "application/x-tar",
    gz: "application/gzip",
  };
  return types[ext || ""] || "application/octet-stream";
}
