import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "12", 10);

  const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || "https://cdn.lovsell.com";

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If not logged in, return popular videos
  if (!user) {
    const { data: videos } = await (supabase as any)
      .from("videos")
      .select(`
        id,
        title,
        slug,
        thumbnail_key,
        thumbnail_url,
        duration,
        views_count,
        created_at,
        user_id,
        category_id,
        users:user_id (
          id,
          username,
          avatar_url
        )
      `)
      .eq("status", "ready")
      .in("visibility", ["public", null])
      .order("views_count", { ascending: false })
      .limit(limit);

    const formattedVideos = (videos || []).map((v: any) => ({
      id: v.id,
      title: v.title,
      slug: v.slug || v.id,
      thumbnail_url: v.thumbnail_url || (v.thumbnail_key ? `${CDN_URL}/${v.thumbnail_key}` : null),
      duration: v.duration,
      views_count: v.views_count || 0,
      created_at: v.created_at,
      channel: v.users ? { username: v.users.username, avatar_url: v.users.avatar_url } : null,
    }));

    return NextResponse.json({ videos: formattedVideos, source: "popular" });
  }

  // Get user's watch history for category preferences
  const { data: watchHistory } = await (supabase as any)
    .from("watch_history")
    .select(`
      video:videos (
        category_id
      )
    `)
    .eq("user_id", user.id)
    .order("last_watched_at", { ascending: false })
    .limit(50);

  // Extract category IDs from watch history
  const categoryIds = (watchHistory || [])
    .map((wh: any) => wh.video?.category_id)
    .filter((id: string) => id);

  // Count category occurrences to find preferred categories
  const categoryCounts: Record<string, number> = {};
  categoryIds.forEach((catId: string) => {
    categoryCounts[catId] = (categoryCounts[catId] || 0) + 1;
  });

  // Get top 3 preferred categories
  const preferredCategories = Object.entries(categoryCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([catId]) => catId);

  // Get user's subscriptions
  const { data: subscriptions } = await (supabase as any)
    .from("channel_subscriptions")
    .select("channel_id")
    .eq("subscriber_id", user.id);

  const subscribedChannelIds = (subscriptions || []).map((s: any) => s.channel_id);

  // Get IDs of videos already watched
  const watchedVideoIds = (watchHistory || [])
    .map((wh: any) => wh.video?.id)
    .filter((id: string) => id);

  // Build recommendations query
  // Priority: 1) From subscribed channels 2) From preferred categories 3) Popular

  const recommendations: any[] = [];
  const seenIds = new Set<string>();

  // 1. Videos from subscribed channels (if any)
  if (subscribedChannelIds.length > 0) {
    const { data: subVideos } = await (supabase as any)
      .from("videos")
      .select(`
        id,
        title,
        slug,
        thumbnail_key,
        thumbnail_url,
        duration,
        views_count,
        created_at,
        user_id,
        users:user_id (
          id,
          username,
          avatar_url
        )
      `)
      .eq("status", "ready")
      .in("visibility", ["public", null])
      .in("user_id", subscribedChannelIds)
      .order("created_at", { ascending: false })
      .limit(Math.ceil(limit / 2));

    (subVideos || []).forEach((v: any) => {
      if (!seenIds.has(v.id) && !watchedVideoIds.includes(v.id)) {
        seenIds.add(v.id);
        recommendations.push({ ...v, source: "subscription" });
      }
    });
  }

  // 2. Videos from preferred categories
  if (preferredCategories.length > 0 && recommendations.length < limit) {
    const { data: catVideos } = await (supabase as any)
      .from("videos")
      .select(`
        id,
        title,
        slug,
        thumbnail_key,
        thumbnail_url,
        duration,
        views_count,
        created_at,
        user_id,
        users:user_id (
          id,
          username,
          avatar_url
        )
      `)
      .eq("status", "ready")
      .in("visibility", ["public", null])
      .in("category_id", preferredCategories)
      .neq("user_id", user.id) // Don't recommend own videos
      .order("views_count", { ascending: false })
      .limit(limit);

    (catVideos || []).forEach((v: any) => {
      if (!seenIds.has(v.id) && !watchedVideoIds.includes(v.id) && recommendations.length < limit) {
        seenIds.add(v.id);
        recommendations.push({ ...v, source: "category" });
      }
    });
  }

  // 3. Fill with popular videos if needed
  if (recommendations.length < limit) {
    const { data: popVideos } = await (supabase as any)
      .from("videos")
      .select(`
        id,
        title,
        slug,
        thumbnail_key,
        thumbnail_url,
        duration,
        views_count,
        created_at,
        user_id,
        users:user_id (
          id,
          username,
          avatar_url
        )
      `)
      .eq("status", "ready")
      .in("visibility", ["public", null])
      .neq("user_id", user.id)
      .order("views_count", { ascending: false })
      .limit(limit * 2);

    (popVideos || []).forEach((v: any) => {
      if (!seenIds.has(v.id) && !watchedVideoIds.includes(v.id) && recommendations.length < limit) {
        seenIds.add(v.id);
        recommendations.push({ ...v, source: "popular" });
      }
    });
  }

  // Format videos for response
  const formattedVideos = recommendations.map((v: any) => ({
    id: v.id,
    title: v.title,
    slug: v.slug || v.id,
    thumbnail_url: v.thumbnail_url || (v.thumbnail_key ? `${CDN_URL}/${v.thumbnail_key}` : null),
    duration: v.duration,
    views_count: v.views_count || 0,
    created_at: v.created_at,
    channel: v.users ? { username: v.users.username, avatar_url: v.users.avatar_url } : null,
    source: v.source,
  }));

  return NextResponse.json({
    videos: formattedVideos,
    sources: {
      subscriptions: subscribedChannelIds.length,
      preferredCategories: preferredCategories.length,
    },
  });
}
