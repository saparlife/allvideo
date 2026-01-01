"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface VideoCardProps {
  video: {
    id: string;
    slug: string;
    title: string;
    thumbnail_url?: string | null;
    duration?: number | null;
    views_count: number;
    created_at: string;
    channel?: {
      username: string;
      display_name?: string | null;
      avatar_url?: string | null;
    };
  };
  size?: "default" | "small";
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

export function VideoCard({ video, size = "default" }: VideoCardProps) {
  const router = useRouter();
  const isSmall = size === "small";

  const handleCardClick = () => {
    router.push(`/watch/${video.slug || video.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group block cursor-pointer"
    >
      {/* Thumbnail */}
      <div
        className={`relative bg-gray-200 rounded-xl overflow-hidden ${isSmall ? "aspect-video" : "aspect-video"}`}
      >
        {video.thumbnail_url ? (
          <Image
            src={video.thumbnail_url}
            alt={video.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes={isSmall ? "200px" : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        )}

        {/* Duration badge */}
        {video.duration && (
          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 text-xs font-medium bg-black/80 text-white rounded">
            {formatDuration(video.duration)}
          </span>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
      </div>

      {/* Info */}
      <div className={`flex gap-3 ${isSmall ? "mt-2" : "mt-3"}`}>
        {/* Channel avatar */}
        {video.channel && !isSmall && (
          <Link
            href={`/channel/${video.channel.username}`}
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 cursor-pointer"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
              {video.channel.avatar_url ? (
                <Image
                  src={video.channel.avatar_url}
                  alt={video.channel.display_name || video.channel.username}
                  width={36}
                  height={36}
                  className="rounded-full object-cover"
                />
              ) : (
                <span className="text-white text-sm font-medium">
                  {(video.channel.display_name || video.channel.username)[0]?.toUpperCase()}
                </span>
              )}
            </div>
          </Link>
        )}

        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3
            className={`font-medium text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition-colors ${isSmall ? "text-sm" : "text-base"}`}
          >
            {video.title}
          </h3>

          {/* Channel name */}
          {video.channel && (
            <Link
              href={`/channel/${video.channel.username}`}
              onClick={(e) => e.stopPropagation()}
              className={`text-gray-600 hover:text-gray-900 transition-colors cursor-pointer ${isSmall ? "text-xs" : "text-sm"}`}
            >
              {video.channel.display_name || video.channel.username}
            </Link>
          )}

          {/* Views and date */}
          <p className={`text-gray-500 ${isSmall ? "text-xs" : "text-sm"}`}>
            {formatViews(video.views_count)} views • {timeAgo(video.created_at)}
          </p>
        </div>
      </div>
    </div>
  );
}
