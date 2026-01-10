import { NextRequest } from "next/server";
import { verifyApiKey, apiError, apiSuccess } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { r2Client, R2_BUCKET, R2_PUBLIC_URL, fixVariantUrls } from "@/lib/r2/client";
import { DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command, PutObjectCommand } from "@aws-sdk/client-s3";
import { processImage, getImageMetadata, parseVariants } from "@/lib/processing/image";

/**
 * GET /api/v1/images/:id
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
    const { data: image, error } = await (supabase as any)
      .from("videos")
      .select("*")
      .eq("id", id)
      .eq("user_id", auth.userId)
      .eq("media_type", "image")
      .single();

    if (error || !image) {
      return apiError("Image not found", 404);
    }

    return apiSuccess({
      id: image.id,
      type: "image",
      title: image.title,
      status: image.status,
      original: {
        url: image.original_key ? `${R2_PUBLIC_URL}/${image.original_key}` : null,
        width: image.width,
        height: image.height,
        size: image.original_size_bytes,
      },
      variants: fixVariantUrls((image.custom_metadata as { variants?: Record<string, { url: string }> })?.variants),
      metadata: image.custom_metadata || {},
      createdAt: image.created_at,
      processedAt: image.processed_at,
    });
  } catch (error) {
    console.error("Image GET error:", error);
    return apiError("Internal server error", 500);
  }
}

/**
 * PATCH /api/v1/images/:id
 * Update image metadata or reprocess
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

    // Verify ownership
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing, error: findError } = await (supabase as any)
      .from("videos")
      .select("id, custom_metadata")
      .eq("id", id)
      .eq("user_id", auth.userId)
      .eq("media_type", "image")
      .single();

    if (findError || !existing) {
      return apiError("Image not found", 404);
    }

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (metadata !== undefined) {
      // Merge metadata, preserving variants
      const existingMeta = existing.custom_metadata || {};
      updates.custom_metadata = {
        ...existingMeta,
        ...metadata,
        variants: existingMeta.variants, // Preserve variants
      };
    }

    if (Object.keys(updates).length === 0) {
      return apiError("No fields to update", 400);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: image, error } = await (supabase as any)
      .from("videos")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return apiError("Failed to update image", 500);
    }

    return apiSuccess({
      id: image.id,
      title: image.title,
      metadata: image.custom_metadata,
      updatedAt: image.updated_at,
    });
  } catch (error) {
    console.error("Image PATCH error:", error);
    return apiError("Internal server error", 500);
  }
}

/**
 * DELETE /api/v1/images/:id
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
    const { data: image, error } = await (supabase as any)
      .from("videos")
      .select("*")
      .eq("id", id)
      .eq("user_id", auth.userId)
      .eq("media_type", "image")
      .single();

    if (error || !image) {
      return apiError("Image not found", 404);
    }

    // Delete all files from R2
    try {
      const prefix = `users/${auth.userId}/images/${id}`;
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
    console.error("Image DELETE error:", error);
    return apiError("Internal server error", 500);
  }
}

/**
 * POST /api/v1/images/:id (process uploaded image)
 * Called after presigned URL upload to generate variants
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
    const url = new URL(request.url);
    const variantsParam = url.searchParams.get("variants");
    const format = (url.searchParams.get("format") || "webp") as "webp" | "jpeg" | "png" | "avif";
    const quality = parseInt(url.searchParams.get("quality") || "80");

    const supabase = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: image, error } = await (supabase as any)
      .from("videos")
      .select("*")
      .eq("id", id)
      .eq("user_id", auth.userId)
      .eq("media_type", "image")
      .single();

    if (error || !image) {
      return apiError("Image not found", 404);
    }

    if (!image.original_key) {
      return apiError("Image has no original file", 400);
    }

    // Download original from R2
    const getCommand = new GetObjectCommand({
      Bucket: R2_BUCKET,
      Key: image.original_key,
    });

    const response = await r2Client.send(getCommand);
    const chunks: Uint8Array[] = [];
    // @ts-expect-error - Body is a readable stream
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Get metadata
    const imageInfo = await getImageMetadata(buffer);

    // Process variants
    const variants = parseVariants(variantsParam);
    const processed = await processImage(buffer, variants, format, quality);

    // Upload variants
    const variantUrls: Record<string, { url: string; width: number; height: number; size: number }> = {};
    for (const variant of processed) {
      const variantKey = `users/${auth.userId}/images/${id}/${variant.name}.${variant.format}`;
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
    await (supabase as any)
      .from("videos")
      .update({
        width: imageInfo.width,
        height: imageInfo.height,
        status: "ready",
        processed_at: new Date().toISOString(),
        custom_metadata: {
          ...image.custom_metadata,
          dominantColor: imageInfo.dominantColor,
          hasAlpha: imageInfo.hasAlpha,
          variants: variantUrls,
        },
      })
      .eq("id", id);

    return apiSuccess({
      id: image.id,
      type: "image",
      status: "ready",
      original: {
        url: `${R2_PUBLIC_URL}/${image.original_key}`,
        width: imageInfo.width,
        height: imageInfo.height,
        format: imageInfo.format,
      },
      variants: variantUrls,
      metadata: {
        ...image.custom_metadata,
        dominantColor: imageInfo.dominantColor,
      },
    });
  } catch (error) {
    console.error("Image process error:", error);
    return apiError("Internal server error", 500);
  }
}
