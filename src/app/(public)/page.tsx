import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { CategoriesBar } from "@/components/public/categories-bar";
import { VideoCard } from "@/components/public/video-card";
import { InfiniteVideoGrid } from "@/components/public/infinite-video-grid";
import { HeroSection } from "@/components/public/hero-section";

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || "https://cdn.1app.to";

interface Video {
  id: string;
  title: string;
  slug: string;
  thumbnail_key: string | null;
  thumbnail_url: string | null;
  duration: number | null;
  views_count: number;
  created_at: string;
  user_id: string;
  users: {
    id: string;
    email: string;
    avatar_url: string | null;
  } | null;
}

function VideoGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-video bg-gray-200 rounded-xl" />
          <div className="flex gap-3 mt-3">
            <div className="w-9 h-9 bg-gray-200 rounded-full shrink-0" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-1" />
              <div className="h-3 bg-gray-200 rounded w-1/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

async function VideoGrid() {
  const supabase = await createClient();
  const t = await getTranslations("home");

  // Fetch initial videos for SSR, then client takes over with infinite scroll
  const { data: videos, error } = await (supabase as any)
    .from("videos")
    .select(
      `
      id,
      title,
      slug,
      thumbnail_key,
      duration,
      views_count,
      created_at,
      user_id,
      users:user_id (
        id,
        email,
        avatar_url
      )
    `
    )
    .eq("status", "ready")
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    console.error("Error fetching videos:", error);
  }

  const videoList = (videos || []) as Video[];

  if (videoList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-24 h-24 mb-6 bg-gray-100 rounded-full flex items-center justify-center">
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {t("noVideos")}
        </h2>
        <p className="text-gray-600 max-w-md">{t("exploreCategories")}</p>
      </div>
    );
  }

  // Format initial videos for the infinite scroll component
  const initialVideos = videoList.map((video) => ({
    id: video.id,
    title: video.title,
    slug: video.slug || video.id,
    thumbnail_url: video.thumbnail_url || (video.thumbnail_key ? `${CDN_URL}/${video.thumbnail_key}` : null),
    duration: video.duration,
    views_count: video.views_count || 0,
    created_at: video.created_at,
    user: video.users
      ? {
          id: video.users.id,
          username: video.users.email?.split("@")[0] || video.users.id,
          avatar_url: video.users.avatar_url,
        }
      : null,
  }));

  return <InfiniteVideoGrid initialVideos={initialVideos} sort="recent" />;
}

async function FeaturedVideos() {
  const supabase = await createClient();

  // Get top viewed videos from last 7 days for featured section
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const { data: videos } = await (supabase as any)
    .from("videos")
    .select(`
      id,
      title,
      slug,
      thumbnail_key,
      duration,
      views_count,
      users:user_id (
        email,
        avatar_url
      )
    `)
    .eq("status", "ready")
    .eq("visibility", "public")
    .gte("created_at", weekAgo.toISOString())
    .order("views_count", { ascending: false })
    .limit(4);

  const featuredVideos = (videos || []).map((video: any) => ({
    id: video.id,
    title: video.title,
    slug: video.slug || video.id,
    thumbnail_url: video.thumbnail_key ? `${CDN_URL}/${video.thumbnail_key}` : null,
    duration: video.duration,
    views_count: video.views_count || 0,
    channel: video.users
      ? {
          username: video.users.email?.split("@")[0] || "Unknown",
          avatar_url: video.users.avatar_url,
        }
      : { username: "Unknown", avatar_url: null },
  }));

  return <HeroSection featuredVideos={featuredVideos} />;
}

async function RecommendedForYou() {
  const supabase = await createClient();
  const t = await getTranslations("home");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get user's watch history for category preferences
  const { data: watchHistory } = await (supabase as any)
    .from("watch_history")
    .select(`video:videos(category_id)`)
    .eq("user_id", user.id)
    .order("last_watched_at", { ascending: false })
    .limit(50);

  const categoryIds = (watchHistory || [])
    .map((wh: any) => wh.video?.category_id)
    .filter((id: string) => id);

  const categoryCounts: Record<string, number> = {};
  categoryIds.forEach((catId: string) => {
    categoryCounts[catId] = (categoryCounts[catId] || 0) + 1;
  });

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
  const watchedVideoIds = (watchHistory || []).map((wh: any) => wh.video?.id).filter(Boolean);

  const recommendations: any[] = [];
  const seenIds = new Set<string>();

  // From subscribed channels
  if (subscribedChannelIds.length > 0) {
    const { data: subVideos } = await (supabase as any)
      .from("videos")
      .select(`
        id, title, slug, thumbnail_key, thumbnail_url, duration, views_count, created_at, user_id,
        users:user_id (id, username, avatar_url)
      `)
      .eq("status", "ready")
      .in("visibility", ["public", null])
      .in("user_id", subscribedChannelIds)
      .order("created_at", { ascending: false })
      .limit(8);

    (subVideos || []).forEach((v: any) => {
      if (!seenIds.has(v.id) && !watchedVideoIds.includes(v.id)) {
        seenIds.add(v.id);
        recommendations.push(v);
      }
    });
  }

  // From preferred categories
  if (preferredCategories.length > 0 && recommendations.length < 8) {
    const { data: catVideos } = await (supabase as any)
      .from("videos")
      .select(`
        id, title, slug, thumbnail_key, thumbnail_url, duration, views_count, created_at, user_id,
        users:user_id (id, username, avatar_url)
      `)
      .eq("status", "ready")
      .in("visibility", ["public", null])
      .in("category_id", preferredCategories)
      .neq("user_id", user.id)
      .order("views_count", { ascending: false })
      .limit(12);

    (catVideos || []).forEach((v: any) => {
      if (!seenIds.has(v.id) && !watchedVideoIds.includes(v.id) && recommendations.length < 8) {
        seenIds.add(v.id);
        recommendations.push(v);
      }
    });
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <svg className="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Recommended for you
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {recommendations.map((video: any) => (
          <VideoCard
            key={video.id}
            video={{
              id: video.id,
              title: video.title,
              slug: video.slug || video.id,
              thumbnail_url: video.thumbnail_url || (video.thumbnail_key ? `${CDN_URL}/${video.thumbnail_key}` : null),
              duration: video.duration,
              views_count: video.views_count || 0,
              created_at: video.created_at,
              channel: video.users
                ? { username: video.users.username || "Unknown", avatar_url: video.users.avatar_url }
                : undefined,
            }}
          />
        ))}
      </div>
    </section>
  );
}

async function TrendingVideos() {
  const supabase = await createClient();
  const t = await getTranslations("home");

  // Get trending videos (most views in last 7 days)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

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
      users:user_id (
        id,
        username,
        avatar_url
      )
    `)
    .eq("status", "ready")
    .eq("visibility", "public")
    .gte("created_at", weekAgo.toISOString())
    .order("views_count", { ascending: false })
    .limit(8);

  const trendingVideos = videos || [];

  if (trendingVideos.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <svg className="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
          </svg>
          {t("trending")}
        </h2>
        <a href="/trending" className="text-sm text-indigo-600 hover:underline">
          View all
        </a>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {trendingVideos.map((video: any) => (
          <VideoCard
            key={video.id}
            video={{
              id: video.id,
              title: video.title,
              slug: video.slug || video.id,
              thumbnail_url: video.thumbnail_url || (video.thumbnail_key ? `${CDN_URL}/${video.thumbnail_key}` : null),
              duration: video.duration,
              views_count: video.views_count || 0,
              created_at: video.created_at,
              channel: video.users
                ? {
                    username: video.users.username || "Unknown",
                    avatar_url: video.users.avatar_url,
                  }
                : undefined,
            }}
          />
        ))}
      </div>
    </section>
  );
}

export default async function HomePage() {
  const t = await getTranslations("home");

  return (
    <>
      {/* Hero Section */}
      <Suspense
        fallback={
          <div className="bg-gray-900 h-[400px] animate-pulse" />
        }
      >
        <FeaturedVideos />
      </Suspense>

      <CategoriesBar />
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Recommended for you section (only for logged in users) */}
        <Suspense fallback={null}>
          <RecommendedForYou />
        </Suspense>

        {/* Trending section */}
        <Suspense fallback={<VideoGridSkeleton />}>
          <TrendingVideos />
        </Suspense>

        {/* Recent uploads section */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {t("recentUploads")}
          </h2>
          <Suspense fallback={<VideoGridSkeleton />}>
            <VideoGrid />
          </Suspense>
        </section>
      </div>
    </>
  );
}
