import { NextRequest } from "next/server";
import { verifyApiKey, apiError, apiSuccess } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * POST /api/v1/upload/complete
 * Mark upload as complete and trigger processing
 *
 * Body:
 * - id: string (required) - media ID from upload init
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyApiKey(request);
    if (!auth) {
      return apiError("Invalid or missing API key", 401);
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return apiError("Missing required field: id", 400);
    }

    const supabase = createAdminClient();

    // Get media record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: media, error: mediaError } = await (supabase as any)
      .from("videos")
      .select("*")
      .eq("id", id)
      .eq("user_id", auth.userId)
      .single();

    if (mediaError || !media) {
      return apiError("Media not found", 404);
    }

    if (media.status !== "uploading") {
      return apiError("Media is not in uploading state", 400);
    }

    const mediaType = media.media_type || "video";

    // For video - create transcode job and set status to processing
    if (mediaType === "video") {
      // Update status to processing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("videos")
        .update({
          status: "processing",
          uploaded_at: new Date().toISOString(),
        })
        .eq("id", id);

      // Create transcode job
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("transcode_jobs")
        .insert({
          video_id: id,
          status: "pending",
          priority: 0,
        });

      return apiSuccess({
        id: media.id,
        type: "video",
        status: "processing",
        message: "Video upload complete. Processing will begin shortly.",
        metadata: media.custom_metadata || {},
      });
    }

    // For other media types (image, audio, file) - mark as ready immediately
    // TODO: Add processing for images (resize, compress) and audio (transcode, waveform)
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
      id: media.id,
      type: mediaType,
      status: "ready",
      message: "Upload complete.",
      metadata: media.custom_metadata || {},
    });
  } catch (error) {
    console.error("Upload complete API error:", error);
    return apiError("Internal server error", 500);
  }
}
