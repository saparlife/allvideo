import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { VideoCard } from "@/components/public/video-card";
import type { Metadata } from "next";

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || "https://cdn.lovsell.com";

export const metadata: Metadata = {
  title: "Watch History",
  description: "Your recently watched videos",
};

function VideoListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex gap-4 animate-pulse">
          <div className="w-60 aspect-video bg-gray-200 rounded-xl shrink-0" />
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

async function WatchHistory({ userId }: { userId: string }) {
  const supabase = await createClient();
  const t = await getTranslations();

  // Get watch history
  const { data: history } = await (supabase as any)
    .from("watch_history")
    .select(`
      id,
      last_watched_at,
      progress_seconds,
      video:video_id (
        id,
        title,
        slug,
        thumbnail_key,
        duration,
        views_count,
        created_at,
        users:user_id (
          id,
          username,
          avatar_url
        )
      )
    `)
    .eq("user_id", userId)
    .order("last_watched_at", { ascending: false })
    .limit(50);

  const historyList = (history || []).filter((h: any) => h.video);

  if (historyList.length === 0) {
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
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          No watch history
        </h2>
        <p className="text-gray-600">
          Videos you watch will appear here
        </p>
      </div>
    );
  }

  // Group by date
  const groupedByDate: Record<string, any[]> = {};
  historyList.forEach((item: any) => {
    const date = new Date(item.last_watched_at).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
    if (!groupedByDate[date]) {
      groupedByDate[date] = [];
    }
    groupedByDate[date].push(item);
  });

  return (
    <div className="space-y-8">
      {Object.entries(groupedByDate).map(([date, items]) => (
        <div key={date}>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{date}</h2>
          <div className="space-y-4">
            {items.map((item: any) => (
              <HistoryItem key={item.id} item={item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function HistoryItem({ item }: { item: any }) {
  const video = item.video;
  const thumbnailUrl = video.thumbnail_key
    ? `${CDN_URL}/${video.thumbnail_key}`
    : null;

  return (
    <a
      href={`/watch/${video.slug || video.id}`}
      className="flex gap-4 group cursor-pointer"
    >
      <div className="w-60 shrink-0">
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
                className="w-10 h-10 text-gray-400"
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
          {video.duration && (
            <span className="absolute bottom-2 right-2 px-1.5 py-0.5 text-xs font-medium bg-black/80 text-white rounded">
              {formatDuration(video.duration)}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition-colors">
          {video.title}
        </h3>
        {video.users && (
          <p className="text-sm text-gray-600 mt-1">
            {video.users.username}
          </p>
        )}
        <p className="text-sm text-gray-500 mt-1">
          {formatViews(video.views_count)} views
        </p>
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
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/history");
  }

  const t = await getTranslations("nav");

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("history")}</h1>
        <button className="text-sm text-gray-600 hover:text-gray-900 cursor-pointer">
          Clear all
        </button>
      </div>

      <Suspense fallback={<VideoListSkeleton />}>
        <WatchHistory userId={user.id} />
      </Suspense>
    </div>
  );
}
