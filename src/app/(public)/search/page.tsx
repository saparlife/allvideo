import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { VideoCard } from "@/components/public/video-card";
import { SearchFilters } from "./search-filters";
import type { Metadata } from "next";

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || "https://cdn.1app.to";

interface Props {
  searchParams: Promise<{
    q?: string;
    sort?: string;
    duration?: string;
    date?: string;
    category?: string;
  }>;
}

// Default categories
const defaultCategories = [
  { id: "gaming", slug: "gaming", name: "gaming" },
  { id: "music", slug: "music", name: "music" },
  { id: "entertainment", slug: "entertainment", name: "entertainment" },
  { id: "education", slug: "education", name: "education" },
  { id: "sports", slug: "sports", name: "sports" },
  { id: "news", slug: "news", name: "news" },
  { id: "technology", slug: "technology", name: "technology" },
  { id: "travel", slug: "travel", name: "travel" },
  { id: "howto", slug: "howto", name: "howto" },
  { id: "comedy", slug: "comedy", name: "comedy" },
];

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `${q} - Search` : "Search",
  };
}

function VideoListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex gap-4 animate-pulse">
          <div className="w-80 aspect-video bg-gray-200 rounded-xl shrink-0" />
          <div className="flex-1">
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

async function SearchResults({
  query,
  sort,
  duration,
  date,
  category,
}: {
  query: string;
  sort: string;
  duration: string;
  date: string;
  category: string;
}) {
  const supabase = await createClient();
  const t = await getTranslations("search");

  if (!query) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">{t("placeholder")}</p>
      </div>
    );
  }

  // Search channels matching the query
  const { data: channels } = await (supabase as any)
    .from("users")
    .select(`
      id,
      username,
      avatar_url,
      bio,
      subscribers_count
    `)
    .not("username", "is", null)
    .ilike("username", `%${query}%`)
    .limit(5);

  // Build video search query - search in title, description, and tags
  let queryBuilder = (supabase as any)
    .from("videos")
    .select(
      `
      id,
      title,
      description,
      slug,
      thumbnail_key,
      thumbnail_url,
      duration,
      views_count,
      tags,
      created_at,
      user_id,
      users:user_id (
        id,
        username,
        avatar_url
      )
    `
    )
    .or("status.eq.ready,status.eq.ready")
    .eq("visibility", "public")
    .or(`title.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`);

  // Category filter - need to lookup category ID from slug
  if (category && category !== "all") {
    const { data: categoryData } = await (supabase as any)
      .from("categories")
      .select("id")
      .eq("slug", category)
      .single();

    if (categoryData) {
      queryBuilder = queryBuilder.eq("category_id", categoryData.id);
    }
  }

  // Duration filter
  if (duration === "short") {
    queryBuilder = queryBuilder.lt("duration", 240); // < 4 min
  } else if (duration === "medium") {
    queryBuilder = queryBuilder.gte("duration", 240).lt("duration", 1200); // 4-20 min
  } else if (duration === "long") {
    queryBuilder = queryBuilder.gte("duration", 1200); // > 20 min
  }

  // Date filter
  const now = new Date();
  if (date === "hour") {
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    queryBuilder = queryBuilder.gte("created_at", hourAgo.toISOString());
  } else if (date === "today") {
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    queryBuilder = queryBuilder.gte("created_at", todayStart.toISOString());
  } else if (date === "week") {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    queryBuilder = queryBuilder.gte("created_at", weekAgo.toISOString());
  } else if (date === "month") {
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    queryBuilder = queryBuilder.gte("created_at", monthAgo.toISOString());
  } else if (date === "year") {
    const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    queryBuilder = queryBuilder.gte("created_at", yearAgo.toISOString());
  }

  // Sort
  if (sort === "date") {
    queryBuilder = queryBuilder.order("created_at", { ascending: false });
  } else if (sort === "views") {
    queryBuilder = queryBuilder.order("views_count", { ascending: false });
  } else {
    // Default: relevance (by views for now)
    queryBuilder = queryBuilder.order("views_count", { ascending: false });
  }

  const { data: videos, error } = await queryBuilder.limit(50);

  if (error) {
    console.error("Search error:", error);
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error searching videos</p>
      </div>
    );
  }

  const videoList = videos || [];
  const channelList = channels || [];

  if (videoList.length === 0 && channelList.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          {t("noResults", { query })}
        </h2>
        <p className="text-gray-600">{t("tryDifferent")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Channel Results */}
      {channelList.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            Channels
          </h2>
          <div className="space-y-3">
            {channelList.map((channel: any) => (
              <a
                key={channel.id}
                href={`/channel/${channel.username}`}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden shrink-0">
                  {channel.avatar_url ? (
                    <img
                      src={channel.avatar_url}
                      alt={channel.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400">
                      {channel.username?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                    @{channel.username}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {channel.subscribers_count || 0} subscribers
                  </p>
                  {channel.bio && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                      {channel.bio}
                    </p>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Video Results */}
      {videoList.length > 0 && (
        <div className="space-y-4">
          {channelList.length > 0 && (
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Videos
            </h2>
          )}
          {videoList.map((video: any) => (
            <SearchResultItem key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}

function SearchResultItem({ video }: { video: any }) {
  const thumbnailUrl = video.thumbnail_url || (video.thumbnail_key
    ? `${CDN_URL}/${video.thumbnail_key}`
    : null);

  return (
    <a
      href={`/watch/${video.slug || video.id}`}
      className="flex gap-4 group cursor-pointer"
    >
      {/* Thumbnail */}
      <div className="w-80 shrink-0">
        <div className="relative aspect-video bg-gray-200 rounded-xl overflow-hidden">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
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
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
              </svg>
            </div>
          )}

          {/* Duration */}
          {video.duration && (
            <span className="absolute bottom-2 right-2 px-1.5 py-0.5 text-xs font-medium bg-black/80 text-white rounded">
              {formatDuration(video.duration)}
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 py-1">
        <h3 className="text-lg font-medium text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition-colors">
          {video.title}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {formatViews(video.views_count)} views •{" "}
          {timeAgo(video.created_at)}
        </p>
        {video.users && (
          <p className="text-sm text-gray-600 mt-1">
            {video.users.username}
          </p>
        )}
        {video.description && (
          <p className="text-sm text-gray-500 mt-2 line-clamp-2">
            {video.description}
          </p>
        )}
        {video.tags && video.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {video.tags.slice(0, 5).map((tag: string) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </a>
  );
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function formatViews(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

function timeAgo(date: string): string {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "week", seconds: 604800 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`;
    }
  }

  return "just now";
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = "", sort = "relevance", duration = "any", date = "any", category = "all" } =
    await searchParams;
  const t = await getTranslations("search");

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {q && (
        <h1 className="text-xl font-bold text-gray-900 mb-6">
          {t("results", { query: q })}
        </h1>
      )}

      <div className="flex gap-6">
        {/* Filters sidebar */}
        <aside className="hidden lg:block w-56 shrink-0">
          <SearchFilters
            currentSort={sort}
            currentDuration={duration}
            currentDate={date}
            currentCategory={category}
            categories={defaultCategories}
          />
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0">
          <Suspense fallback={<VideoListSkeleton />}>
            <SearchResults
              query={q}
              sort={sort}
              duration={duration}
              date={date}
              category={category}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
