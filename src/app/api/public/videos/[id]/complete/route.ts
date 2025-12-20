import { NextRequest } from "next/server";
import { verifyApiKey, apiError } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(
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
    const supabase = await createAdminClient();

    // Get video and verify ownership
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: video, error } = await (supabase as any)
      .from("videos")
      .select("*")
      .eq("id", id)
      .eq("user_id", auth.userId)
      .eq("status", "uploading")
      .single();

    if (error || !video) {
      return apiError("Video not found or not in uploading state", 404);
    }

    // Update video status to processing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from("videos")
      .update({ status: "processing" })
      .eq("id", id);

    if (updateError) {
      return apiError("Failed to update video status", 500);
    }

    // Create transcode job
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: jobError } = await (supabase as any)
      .from("transcode_jobs")
      .insert({
        video_id: id,
        status: "pending",
      });

    if (jobError) {
      console.error("Failed to create transcode job:", jobError);
      // Don't fail the request, the video is already marked for processing
    }

    return Response.json({
      id: video.id,
      status: "processing",
      message: "Video queued for transcoding",
    });
  } catch (error) {
    console.error("API error:", error);
    return apiError("Internal server error", 500);
  }
}
