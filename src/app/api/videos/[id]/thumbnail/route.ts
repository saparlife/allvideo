import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { r2Client, R2_BUCKET } from "@/lib/r2/client";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || "https://cdn.lovsell.com";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get video and verify ownership
    const { data: video, error: fetchError } = await (supabase as any)
      .from("videos")
      .select("id, thumbnail_key")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("thumbnail") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, WebP" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size: 5MB" },
        { status: 400 }
      );
    }

    // Generate unique key for the thumbnail
    const extension = file.type.split("/")[1];
    const thumbnailKey = `users/${user.id}/thumbnails/${id}/custom.${extension}`;

    // Delete old custom thumbnail if exists
    if (video.thumbnail_key?.includes("/thumbnails/")) {
      try {
        await r2Client.send(
          new DeleteObjectCommand({
            Bucket: R2_BUCKET,
            Key: video.thumbnail_key,
          })
        );
      } catch {
        // Ignore deletion errors
      }
    }

    // Upload new thumbnail to R2
    const buffer = Buffer.from(await file.arrayBuffer());

    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: thumbnailKey,
        Body: buffer,
        ContentType: file.type,
        CacheControl: "public, max-age=31536000",
      })
    );

    const thumbnailUrl = `${CDN_URL}/${thumbnailKey}`;

    // Update video with new thumbnail
    const { data: updatedVideo, error: updateError } = await (supabase as any)
      .from("videos")
      .update({
        thumbnail_key: thumbnailKey,
        thumbnail_url: thumbnailUrl,
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      video: updatedVideo,
      thumbnail_url: thumbnailUrl,
    });
  } catch (error) {
    console.error("Thumbnail upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload thumbnail" },
      { status: 500 }
    );
  }
}
