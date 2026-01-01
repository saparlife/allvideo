import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || "https://cdn.lovsell.com";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "0");
  const limit = parseInt(searchParams.get("limit") || "12");
  const category = searchParams.get("category");
  const sort = searchParams.get("sort") || "recent"; // recent, popular, trending

  const offset = page * limit;

  let query = (supabase as any)
    .from("videos")
    .select(`
      id,
      title,
      slug,
      thumbnail_url,
      thumbnail_key,
      duration,
      views_count,
      likes_count,
      created_at,
      user:users!videos_user_id_fkey (
        id,
        username,
        avatar_url
      )
    `)
    .or("status.eq.ready,status.eq.ready")
    .eq("visibility", "public");

  // Category filter
  if (category) {
    const { data: cat } = await (supabase as any)
      .from("categories")
      .select("id")
      .eq("slug", category)
      .single();

    if (cat) {
      query = query.eq("category_id", cat.id);
    }
  }

  // Sorting
  switch (sort) {
    case "popular":
      query = query.order("views_count", { ascending: false });
      break;
    case "trending":
      // Videos with most views in last 7 days (approximated by recent + high views)
      query = query
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order("views_count", { ascending: false });
      break;
    case "recent":
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  // Pagination
  query = query.range(offset, offset + limit);

  const { data: videos, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Check if there are more videos
  const hasMore = videos && videos.length === limit + 1;
  const rawVideos = hasMore ? videos.slice(0, limit) : (videos || []);

  // Format videos with proper thumbnail URLs
  const returnedVideos = rawVideos.map((video: any) => ({
    ...video,
    thumbnail_url: video.thumbnail_url || (video.thumbnail_key ? `${CDN_URL}/${video.thumbnail_key}` : null),
    thumbnail_key: undefined,
  }));

  return NextResponse.json({
    videos: returnedVideos,
    hasMore,
    page,
    limit,
  });
}
