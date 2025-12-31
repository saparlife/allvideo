import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { CreateMultipartUploadCommand, UploadPartCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Client, R2_BUCKET } from "@/lib/r2/client";

const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks

export async function POST(request: NextRequest) {
  try {
    console.log("Upload init: Starting...");

    const supabase = await createClient();
    const db = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log("Upload init: Auth check", { userId: user?.id, authError });

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { filename, size, contentType, title } = body;
    console.log("Upload init: Request body", { filename, size, title });

    if (!filename || !size || !title) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Clean up old stuck uploads (older than 1 hour)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any)
      .from("videos")
      .delete()
      .eq("user_id", user.id)
      .eq("status", "uploading")
      .lt("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());

    // Check storage limit
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (db as any)
      .from("users")
      .select("storage_used_bytes, storage_limit_bytes")
      .eq("id", user.id)
      .single();

    if (profile) {
      const newUsage = profile.storage_used_bytes + size;
      if (newUsage > profile.storage_limit_bytes) {
        return NextResponse.json(
          { error: "Storage limit exceeded" },
          { status: 400 }
        );
      }
    }

    // Create video record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: video, error: videoError } = await (db as any)
      .from("videos")
      .insert({
        user_id: user.id,
        title,
        original_filename: filename,
        original_size_bytes: size,
        mime_type: contentType,
        status: "uploading",
      })
      .select()
      .single();

    if (videoError || !video) {
      console.error("Error creating video:", JSON.stringify(videoError));
      return NextResponse.json(
        { error: "Failed to create video record", details: videoError?.message },
        { status: 500 }
      );
    }

    // Generate R2 key
    const extension = filename.split(".").pop() || "mp4";
    const originalKey = `users/${user.id}/originals/${video.id}/original.${extension}`;
    console.log("Upload init: Generated key", originalKey);

    // Update video with original_key
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any)
      .from("videos")
      .update({ original_key: originalKey })
      .eq("id", video.id);

    // Calculate number of parts
    const numParts = Math.ceil(size / CHUNK_SIZE);
    console.log("Upload init: Multipart upload", { numParts, chunkSize: CHUNK_SIZE });

    // Create multipart upload
    const createCommand = new CreateMultipartUploadCommand({
      Bucket: R2_BUCKET,
      Key: originalKey,
      ContentType: contentType,
    });

    const { UploadId } = await r2Client.send(createCommand);

    if (!UploadId) {
      throw new Error("Failed to create multipart upload");
    }

    // Generate presigned URLs for each part
    const parts: { partNumber: number; uploadUrl: string }[] = [];

    for (let i = 1; i <= numParts; i++) {
      const uploadPartCommand = new UploadPartCommand({
        Bucket: R2_BUCKET,
        Key: originalKey,
        UploadId,
        PartNumber: i,
      });

      const uploadUrl = await getSignedUrl(r2Client, uploadPartCommand, { expiresIn: 3600 });
      parts.push({ partNumber: i, uploadUrl });
    }

    console.log("Upload init: Success, multipart upload created");

    return NextResponse.json({
      videoId: video.id,
      uploadId: UploadId,
      key: originalKey,
      parts,
      chunkSize: CHUNK_SIZE,
    });
  } catch (error) {
    console.error("Upload init error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
