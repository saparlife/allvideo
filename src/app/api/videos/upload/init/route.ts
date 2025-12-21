import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Client, R2_BUCKET } from "@/lib/r2/client";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminDb = await createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = adminDb as any;

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { filename, size, contentType, title } = body;

    if (!filename || !size || !title) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check storage limit
    const { data: profile } = await db
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
    const { data: video, error: videoError } = await db
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
      console.error("Error creating video:", videoError);
      return NextResponse.json(
        { error: "Failed to create video record" },
        { status: 500 }
      );
    }

    // Generate R2 key
    const extension = filename.split(".").pop() || "mp4";
    const originalKey = `users/${user.id}/originals/${video.id}/original.${extension}`;

    // Update video with original_key
    await db
      .from("videos")
      .update({ original_key: originalKey })
      .eq("id", video.id);

    // Generate presigned URL for direct upload to R2
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: originalKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });

    return NextResponse.json({
      videoId: video.id,
      uploadUrl,
      key: originalKey,
    });
  } catch (error) {
    console.error("Upload init error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
