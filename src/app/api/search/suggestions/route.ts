import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || "https://cdn.lovsell.com";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  const searchTerm = query.trim().toLowerCase();

  // Search videos
  const { data: videos } = await (supabase as any)
    .from("videos")
    .select(`
      id,
      title,
      slug,
      thumbnail_url,
      thumbnail_key
    `)
    .or("status.eq.ready,status.eq.ready")
    .eq("visibility", "public")
    .ilike("title", `%${searchTerm}%`)
    .limit(5);

  // Search channels
  const { data: channels } = await (supabase as any)
    .from("users")
    .select(`
      id,
      username,
      avatar_url
    `)
    .not("username", "is", null)
    .ilike("username", `%${searchTerm}%`)
    .limit(3);

  const suggestions = [
    // Videos
    ...(videos || []).map((video: any) => ({
      type: "video" as const,
      id: video.id,
      title: video.title,
      slug: video.slug,
      thumbnail: video.thumbnail_url || (video.thumbnail_key ? `${CDN_URL}/${video.thumbnail_key}` : null),
    })),
    // Channels
    ...(channels || []).map((channel: any) => ({
      type: "channel" as const,
      id: channel.id,
      title: channel.username,
      username: channel.username,
      avatar: channel.avatar_url,
    })),
  ];

  return NextResponse.json({ suggestions });
}
