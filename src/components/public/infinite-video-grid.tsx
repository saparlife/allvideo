"use client";

import { useCallback } from "react";
import { VideoCard } from "./video-card";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { Loader2 } from "lucide-react";

interface Video {
  id: string;
  title: string;
  slug: string;
  thumbnail_url: string | null;
  duration: number | null;
  views_count: number;
  created_at: string;
  user: {
    id: string;
    username: string;
    avatar_url: string | null;
  } | null;
}

interface InfiniteVideoGridProps {
  initialVideos?: Video[];
  category?: string;
  sort?: "recent" | "popular" | "trending";
  pageSize?: number;
}

export function InfiniteVideoGrid({
  initialVideos = [],
  category,
  sort = "recent",
  pageSize = 12,
}: InfiniteVideoGridProps) {
  const fetchVideos = useCallback(
    async (page: number, limit: number) => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: (limit + 1).toString(), // Fetch one extra to check hasMore
        sort,
      });

      if (category) {
        params.set("category", category);
      }

      const response = await fetch(`/api/videos/public?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch videos");
      }

      const data = await response.json();
      return {
        data: data.videos,
        hasMore: data.hasMore,
      };
    },
    [category, sort]
  );

  const {
    data: videos,
    isLoading,
    isLoadingMore,
    hasMore,
    sentinelRef,
  } = useInfiniteScroll<Video>({
    fetchFn: fetchVideos,
    pageSize,
    initialData: initialVideos,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: pageSize }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-video bg-gray-200 rounded-lg" />
            <div className="mt-3 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No videos found</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {videos.map((video) => (
          <VideoCard
            key={video.id}
            video={{
              id: video.id,
              title: video.title,
              slug: video.slug,
              thumbnail_url: video.thumbnail_url,
              duration: video.duration,
              views_count: video.views_count,
              created_at: video.created_at,
              channel: video.user
                ? {
                    username: video.user.username,
                    avatar_url: video.user.avatar_url,
                  }
                : undefined,
            }}
          />
        ))}
      </div>

      {/* Sentinel for infinite scroll */}
      {hasMore && (
        <div
          ref={sentinelRef}
          className="flex items-center justify-center py-8"
        >
          {isLoadingMore && (
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          )}
        </div>
      )}
    </>
  );
}
