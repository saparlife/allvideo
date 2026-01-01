import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/videos/[id]/transcript - Get video transcript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch video with transcript fields
  const { data, error } = await (supabase as any)
    .from("videos")
    .select(`
      id,
      title,
      duration_seconds,
      transcript_text,
      transcript_vtt,
      transcript_segments,
      transcript_language,
      transcription_status,
      visibility
    `)
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  // Check visibility - only allow public videos or owner's videos
  if (data.visibility === "private") {
    const { data: { user } } = await supabase.auth.getUser();

    // Get video owner
    const { data: video } = await (supabase as any)
      .from("videos")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!user || video?.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  }

  // Check if transcription is available
  if (data.transcription_status !== "completed" || !data.transcript_text) {
    return NextResponse.json({
      status: data.transcription_status || "pending",
      message: data.transcription_status === "skipped"
        ? "Transcription was skipped for this video"
        : data.transcription_status === "failed"
          ? "Transcription failed for this video"
          : "Transcription is not yet available",
    }, { status: 202 });
  }

  // Return transcript data
  return NextResponse.json({
    id: data.id,
    title: data.title,
    duration: data.duration_seconds,
    language: data.transcript_language,
    text: data.transcript_text,
    segments: data.transcript_segments || [],
    vtt: data.transcript_vtt,
  });
}
