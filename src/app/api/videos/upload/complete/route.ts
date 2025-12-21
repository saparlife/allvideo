import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

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
    const { videoId } = body;

    if (!videoId) {
      return NextResponse.json(
        { error: "Missing videoId" },
        { status: 400 }
      );
    }

    // Verify video belongs to user
    const { data: video, error: videoError } = await db
      .from("videos")
      .select("*")
      .eq("id", videoId)
      .eq("user_id", user.id)
      .single();

    if (videoError || !video) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    // Update video status to processing
    const { error: updateError } = await db
      .from("videos")
      .update({
        status: "processing",
      })
      .eq("id", videoId);

    if (updateError) {
      console.error("Error updating video:", updateError);
      return NextResponse.json(
        { error: "Failed to update video status" },
        { status: 500 }
      );
    }

    // Create transcode job
    const { error: jobError } = await db
      .from("transcode_jobs")
      .insert({
        video_id: videoId,
        status: "pending",
        priority: 0,
      });

    if (jobError) {
      console.error("Error creating transcode job:", jobError);
      // Don't fail the request, video is uploaded
    }

    return NextResponse.json({
      success: true,
      videoId,
      message: "Video uploaded, processing will begin shortly",
    });
  } catch (error) {
    console.error("Upload complete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
