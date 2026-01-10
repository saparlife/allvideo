import { Suspense } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { VideoCard } from "@/components/public/video-card";
import type { Metadata } from "next";

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || "https://cdn.1app.to";

export const metadata: Metadata = {
  title: "Trending",
  description: "Watch the most popular videos on UnlimVideo right now",
};

interface Props {
  searchParams: Promise<{ category?: string }>;
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
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

async function TrendingVideos({ categorySlug }: { categorySlug?: string }) {
  const supabase = await createClient();
  const t = await getTranslations();

  // Get videos from the last 30 days, sorted by views
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  let query = (supabase as any)
    .from("videos")
    .select(`
      id,
      title,
      slug,
      thumbnail_key,
      thumbnail_url,
      duration,
      views_count,
      likes_count,
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
    .gte("created_at", monthAgo.toISOString());

  // Filter by category if specified
  if (categorySlug && categorySlug !== "all") {
    const { data: category } = await (supabase as any)
      .from("categories")
      .select("id")
      .eq("slug", categorySlug)
      .single();

    if (category) {
      query = query.eq("category_id", category.id);
    }
  }

  const { data: videos } = await query
    .order("views_count", { ascending: false })
    .limit(48);

  const videoList = videos || [];

  if (videoList.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg
            className="w-10 h-10 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          No trending videos
        </h2>
        <p className="text-gray-600">Check back later for trending content</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top 3 featured */}
      {videoList.length >= 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {videoList.slice(0, 3).map((video: any, index: number) => (
            <div key={video.id} className="relative">
              <div className="absolute top-2 left-2 z-10 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                #{index + 1}
              </div>
              <VideoCard
                video={{
                  id: video.id,
                  slug: video.slug || video.id,
                  title: video.title,
                  thumbnail_url: video.thumbnail_url || (video.thumbnail_key
                    ? `${CDN_URL}/${video.thumbnail_key}`
                    : null),
                  duration: video.duration,
                  views_count: video.views_count || 0,
                  created_at: video.created_at,
                  channel: video.users
                    ? {
                        username: video.users.username || video.users.id,
                        avatar_url: video.users.avatar_url,
                      }
                    : undefined,
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Rest of trending videos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {videoList.slice(3).map((video: any) => (
          <VideoCard
            key={video.id}
            video={{
              id: video.id,
              slug: video.slug || video.id,
              title: video.title,
              thumbnail_url: video.thumbnail_url || (video.thumbnail_key
                ? `${CDN_URL}/${video.thumbnail_key}`
                : null),
              duration: video.duration,
              views_count: video.views_count || 0,
              created_at: video.created_at,
              channel: video.users
                ? {
                    username: video.users.username || video.users.id,
                    avatar_url: video.users.avatar_url,
                  }
                : undefined,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default async function TrendingPage({ searchParams }: Props) {
  const { category: categorySlug } = await searchParams;
  const t = await getTranslations("nav");
  const supabase = await createClient();

  // Fetch categories
  const { data: categories } = await (supabase as any)
    .from("categories")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("sort_order");

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("trending")}</h1>
          <p className="text-sm text-gray-600">
            Most popular videos this week
          </p>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <Link
          href="/trending"
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            !categorySlug
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All
        </Link>
        {(categories || []).map((cat: any) => (
          <Link
            key={cat.id}
            href={`/trending?category=${cat.slug}`}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              categorySlug === cat.slug
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      <Suspense fallback={<VideoGridSkeleton />}>
        <TrendingVideos categorySlug={categorySlug} />
      </Suspense>
    </div>
  );
}
