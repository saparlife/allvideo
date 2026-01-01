import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/videos/[id]/subtitles - Get video subtitles as VTT
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch video with transcript VTT
  const { data, error } = await (supabase as any)
    .from("videos")
    .select(`
      transcript_vtt,
      transcription_status,
      visibility,
      user_id
    `)
    .eq("id", id)
    .single();

  if (error || !data) {
    return new NextResponse("Video not found", { status: 404 });
  }

  // Check visibility for private videos
  if (data.visibility === "private") {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || data.user_id !== user.id) {
      return new NextResponse("Unauthorized", { status: 403 });
    }
  }

  // Check if subtitles are available
  if (data.transcription_status !== "completed" || !data.transcript_vtt) {
    // Return empty VTT file
    return new NextResponse("WEBVTT\n\n", {
      headers: {
        "Content-Type": "text/vtt; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  // Return VTT file
  return new NextResponse(data.transcript_vtt, {
    headers: {
      "Content-Type": "text/vtt; charset=utf-8",
      "Cache-Control": "public, max-age=86400", // Cache for 24 hours
    },
  });
}
