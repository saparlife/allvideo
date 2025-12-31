import { NextRequest } from "next/server";
import { verifyApiKey, apiError } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { r2Client, R2_BUCKET } from "@/lib/r2/client";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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
    const { title, filename, size } = body;

    if (!title || !filename || !size) {
      return apiError("Missing required fields: title, filename, size");
    }

    const supabase = createAdminClient();

    // Check user storage limit
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: user, error: userError } = await (supabase as any)
      .from("users")
      .select("storage_limit_bytes, storage_used_bytes")
      .eq("id", auth.userId)
      .single();

    if (userError || !user) {
      return apiError("User not found", 404);
    }

    if (user.storage_used_bytes + size > user.storage_limit_bytes) {
      return apiError("Storage limit exceeded", 403);
    }

    // Create video record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: video, error: videoError } = await (supabase as any)
      .from("videos")
      .insert({
        user_id: auth.userId,
        title,
        original_filename: filename,
        original_size_bytes: size,
        status: "uploading",
      })
      .select()
      .single();

    if (videoError || !video) {
      return apiError("Failed to create video record", 500);
    }

    // Generate presigned URL for upload
    const key = `users/${auth.userId}/originals/${video.id}/${filename}`;
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: "video/*",
    });

    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });

    // Update video with original_key
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("videos")
      .update({ original_key: key })
      .eq("id", video.id);

    return Response.json({
      id: video.id,
      uploadUrl,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error("API error:", error);
    return apiError("Internal server error", 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyApiKey(request);
    if (!auth) {
      return apiError("Invalid or missing API key", 401);
    }

    if (!auth.permissions.read) {
      return apiError("API key does not have read permission", 403);
    }

    const supabase = createAdminClient();

    // Get all videos for the user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: videos, error } = await (supabase as any)
      .from("videos")
      .select("id, title, status, duration_seconds, thumbnail_url, hls_url, created_at")
      .eq("user_id", auth.userId)
      .order("created_at", { ascending: false });

    if (error) {
      return apiError("Failed to fetch videos", 500);
    }

    return Response.json({ videos: videos || [] });
  } catch (error) {
    console.error("API error:", error);
    return apiError("Internal server error", 500);
  }
}
