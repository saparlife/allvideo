import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { r2Client, R2_BUCKET, R2_PUBLIC_URL } from "@/lib/r2/client";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { processImage, getImageMetadata, parseVariants } from "@/lib/processing/image";

type MediaType = "image" | "audio" | "file";

function getMediaTypeFromFile(mimeType: string): MediaType {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("audio/")) return "audio";
  return "file";
}

/**
 * POST /api/media/upload
 * Dashboard upload endpoint for images, audio, and files
 * Uses session-based authentication (not API key)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const db = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const mediaType = getMediaTypeFromFile(file.type);

    // Check storage limit
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (db as any)
      .from("users")
      .select("storage_used_bytes, storage_limit_bytes")
      .eq("id", user.id)
      .single();

    if (profile) {
      const newUsage = profile.storage_used_bytes + file.size;
      if (newUsage > profile.storage_limit_bytes) {
        return NextResponse.json({ error: "Storage limit exceeded" }, { status: 400 });
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Handle image uploads with processing
    if (mediaType === "image") {
      const imageInfo = await getImageMetadata(buffer);

      // Create record
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: media, error: mediaError } = await (db as any)
        .from("videos")
        .insert({
          user_id: user.id,
          title,
          original_filename: file.name,
          original_size_bytes: file.size,
          mime_type: file.type,
          media_type: "image",
          width: imageInfo.width,
          height: imageInfo.height,
          custom_metadata: {
            dominantColor: imageInfo.dominantColor,
            hasAlpha: imageInfo.hasAlpha,
          },
          status: "processing",
        })
        .select()
        .single();

      if (mediaError || !media) {
        return NextResponse.json({ error: "Failed to create record" }, { status: 500 });
      }

      // Upload original
      const originalKey = `users/${user.id}/images/${media.id}/original.${imageInfo.format}`;
      await r2Client.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET,
          Key: originalKey,
          Body: buffer,
          ContentType: file.type,
        })
      );

      // Process variants
      const variants = parseVariants(null);
      const processed = await processImage(buffer, variants, "webp", 80);

      // Upload variants
      const variantUrls: Record<string, { url: string; width: number; height: number; size: number }> = {};
      for (const variant of processed) {
        const variantKey = `users/${user.id}/images/${media.id}/${variant.name}.${variant.format}`;
        await r2Client.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: variantKey,
            Body: variant.buffer,
            ContentType: `image/${variant.format}`,
          })
        );
        variantUrls[variant.name] = {
          url: `${R2_PUBLIC_URL}/${variantKey}`,
          width: variant.width,
          height: variant.height,
          size: variant.size,
        };
      }

      // Update record
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (db as any)
        .from("videos")
        .update({
          original_key: originalKey,
          thumbnail_key: variantUrls.thumbnail ? `users/${user.id}/images/${media.id}/thumbnail.webp` : null,
          status: "ready",
          processed_at: new Date().toISOString(),
          custom_metadata: {
            dominantColor: imageInfo.dominantColor,
            hasAlpha: imageInfo.hasAlpha,
            variants: variantUrls,
          },
        })
        .eq("id", media.id);

      // Update storage used
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (db as any)
        .from("users")
        .update({
          storage_used_bytes: (profile?.storage_used_bytes || 0) + file.size,
        })
        .eq("id", user.id);

      return NextResponse.json({
        id: media.id,
        type: "image",
        status: "ready",
        title,
      });
    }

    // Handle audio/file uploads (simple storage without processing)
    const extension = file.name.split(".").pop() || "bin";
    const folder = mediaType === "audio" ? "audio" : "files";

    // Create record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: media, error: mediaError } = await (db as any)
      .from("videos")
      .insert({
        user_id: user.id,
        title,
        original_filename: file.name,
        original_size_bytes: file.size,
        mime_type: file.type,
        media_type: mediaType,
        status: "processing",
      })
      .select()
      .single();

    if (mediaError || !media) {
      return NextResponse.json({ error: "Failed to create record" }, { status: 500 });
    }

    // Upload file
    const originalKey = `users/${user.id}/${folder}/${media.id}/original.${extension}`;
    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: originalKey,
        Body: buffer,
        ContentType: file.type,
      })
    );

    // Update record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any)
      .from("videos")
      .update({
        original_key: originalKey,
        status: "ready",
        processed_at: new Date().toISOString(),
      })
      .eq("id", media.id);

    // Update storage used
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any)
      .from("users")
      .update({
        storage_used_bytes: (profile?.storage_used_bytes || 0) + file.size,
      })
      .eq("id", user.id);

    return NextResponse.json({
      id: media.id,
      type: mediaType,
      status: "ready",
      title,
    });
  } catch (error) {
    console.error("Media upload error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
