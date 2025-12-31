import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = createAdminClient();

  // Get current video
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: video } = await (db as any)
    .from("videos")
    .select("id, views_count, status")
    .eq("id", id)
    .eq("status", "ready")
    .single();

  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  // Increment views
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db as any)
    .from("videos")
    .update({ views_count: (video.views_count || 0) + 1 })
    .eq("id", id);

  return NextResponse.json({ success: true, views: video.views_count + 1 });
}
