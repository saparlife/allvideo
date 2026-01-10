import { NextRequest } from "next/server";
import { verifyApiKey, apiError, apiSuccess } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { r2Client, R2_BUCKET, R2_PUBLIC_URL, fixVariantUrls } from "@/lib/r2/client";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { processImage, getImageMetadata, parseVariants, DEFAULT_VARIANTS } from "@/lib/processing/image";
import { validateFile, type SubscriptionTier } from "@/lib/validation/file";

/**
 * POST /api/v1/images
 * Upload and process an image
 *
 * Query params:
 * - variants: comma-separated list or preset name (default: thumbnail,small,medium,large)
 * - format: output format (webp, jpeg, png, avif) - default: webp
 * - quality: 1-100 (default: 80)
 *
 * Body (multipart/form-data):
 * - file: image file
 * - title: optional title
 * - metadata: optional JSON string
 *
 * OR Body (JSON for presigned URL flow):
 * - filename: string
 * - size: number
 * - title: string (optional)
 * - metadata: object (optional)
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
    const variantsParam = url.searchParams.get("variants");
    const format = (url.searchParams.get("format") || "webp") as "webp" | "jpeg" | "png" | "avif";
    const quality = parseInt(url.searchParams.get("quality") || "80");

    const supabase = createAdminClient();

    // Check storage limit
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

    // Handle multipart form data (direct upload with processing)
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

      // Check storage
      if (user.storage_used_bytes + file.size > user.storage_limit_bytes) {
        return apiError("Storage limit exceeded", 403);
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const metadata = metadataStr ? JSON.parse(metadataStr) : {};

      // Get image metadata
      const imageInfo = await getImageMetadata(buffer);

      // Create record
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: image, error: imageError } = await (supabase as any)
        .from("videos")
        .insert({
          user_id: auth.userId,
          title: title || safeName,
          original_filename: safeName,
          original_size_bytes: file.size,
          mime_type: file.type,
          media_type: "image",
          width: imageInfo.width,
          height: imageInfo.height,
          custom_metadata: {
            ...metadata,
            dominantColor: imageInfo.dominantColor,
            hasAlpha: imageInfo.hasAlpha,
          },
          status: "processing",
        })
        .select()
        .single();

      if (imageError || !image) {
        return apiError("Failed to create image record", 500);
      }

      // Upload original
      const originalKey = `users/${auth.userId}/images/${image.id}/original.${imageInfo.format}`;
      await r2Client.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET,
          Key: originalKey,
          Body: buffer,
          ContentType: file.type,
        })
      );

      // Process variants
      const variants = parseVariants(variantsParam);
      const processed = await processImage(buffer, variants, format, quality);

      // Upload variants
      const variantUrls: Record<string, { url: string; width: number; height: number; size: number }> = {};
      for (const variant of processed) {
        const variantKey = `users/${auth.userId}/images/${image.id}/${variant.name}.${variant.format}`;
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

      // Update record with URLs
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("videos")
        .update({
          original_key: originalKey,
          status: "ready",
          processed_at: new Date().toISOString(),
          custom_metadata: {
            ...image.custom_metadata,
            variants: variantUrls,
          },
        })
        .eq("id", image.id);

      return apiSuccess({
        id: image.id,
        type: "image",
        status: "ready",
        original: {
          url: `${R2_PUBLIC_URL}/${originalKey}`,
          width: imageInfo.width,
          height: imageInfo.height,
          size: file.size,
          format: imageInfo.format,
        },
        variants: variantUrls,
        metadata: {
          ...metadata,
          dominantColor: imageInfo.dominantColor,
        },
      });
    }

    // Handle JSON body (presigned URL flow)
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

    // Create record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: image, error: imageError } = await (supabase as any)
      .from("videos")
      .insert({
        user_id: auth.userId,
        title: title || safeName,
        original_filename: safeName,
        original_size_bytes: size,
        mime_type: guessMimeType(filename),
        media_type: "image",
        custom_metadata: metadata || {},
        status: "uploading",
      })
      .select()
      .single();

    if (imageError || !image) {
      return apiError("Failed to create image record", 500);
    }

    // Generate presigned URL
    const key = `users/${auth.userId}/images/${image.id}/original_${safeName}`;
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: guessMimeType(filename),
    });

    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("videos")
      .update({ original_key: key })
      .eq("id", image.id);

    return apiSuccess({
      id: image.id,
      type: "image",
      uploadUrl,
      expiresIn: 3600,
      metadata: metadata || {},
      note: "After upload, call POST /api/v1/images/{id}/process to generate variants",
    });
  } catch (error) {
    console.error("Images API error:", error);
    return apiError("Internal server error", 500);
  }
}

/**
 * GET /api/v1/images
 * List all images
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyApiKey(request);
    if (!auth) {
      return apiError("Invalid or missing API key", 401);
    }

    if (!auth.permissions.read) {
      return apiError("API key does not have read permission", 403);
    }

    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
    const offset = parseInt(url.searchParams.get("offset") || "0");

    const supabase = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: images, error } = await (supabase as any)
      .from("videos")
      .select("id, title, status, width, height, original_size_bytes, custom_metadata, created_at, original_key")
      .eq("user_id", auth.userId)
      .eq("media_type", "image")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return apiError("Failed to fetch images", 500);
    }

    const result = (images || []).map((img: {
      id: string;
      title: string;
      status: string;
      width: number;
      height: number;
      original_size_bytes: number;
      custom_metadata: Record<string, unknown>;
      created_at: string;
      original_key: string;
    }) => ({
      id: img.id,
      type: "image",
      title: img.title,
      status: img.status,
      resolution: img.width && img.height ? `${img.width}x${img.height}` : null,
      size: img.original_size_bytes,
      metadata: img.custom_metadata || {},
      variants: fixVariantUrls((img.custom_metadata as { variants?: Record<string, { url: string }> })?.variants),
      originalUrl: img.original_key ? `${R2_PUBLIC_URL}/${img.original_key}` : null,
      createdAt: img.created_at,
    }));

    return apiSuccess({
      images: result,
      pagination: { limit, offset, hasMore: result.length === limit },
    });
  } catch (error) {
    console.error("Images API error:", error);
    return apiError("Internal server error", 500);
  }
}

function guessMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const types: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    avif: "image/avif",
  };
  return types[ext || ""] || "image/jpeg";
}
