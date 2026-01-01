import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Set featured video for current user's channel
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { video_id } = body;

    // If video_id is provided, verify it belongs to the user and is ready
    if (video_id) {
      const { data: video, error: videoError } = await (supabase as any)
        .from("videos")
        .select("id")
        .eq("id", video_id)
        .eq("user_id", user.id)
        .eq("status", "ready")
        .single();

      if (videoError || !video) {
        return NextResponse.json(
          { error: "Video not found or not ready" },
          { status: 404 }
        );
      }
    }

    // Update user's featured video
    const { error: updateError } = await (supabase as any)
      .from("users")
      .update({ featured_video_id: video_id || null })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error setting featured video:", updateError);
      return NextResponse.json(
        { error: "Failed to update featured video" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, featured_video_id: video_id || null });
  } catch (error) {
    console.error("Featured video error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Get current featured video
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: userData, error } = await (supabase as any)
    .from("users")
    .select("featured_video_id")
    .eq("id", user.id)
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to get featured video" },
      { status: 500 }
    );
  }

  return NextResponse.json({ featured_video_id: userData?.featured_video_id || null });
}
