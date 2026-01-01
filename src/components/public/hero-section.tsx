"use client";

import Link from "next/link";
import { Play, TrendingUp, Users } from "lucide-react";

interface FeaturedVideo {
  id: string;
  title: string;
  slug: string;
  thumbnail_url: string | null;
  duration: number | null;
  views_count: number;
  channel: {
    username: string;
    avatar_url: string | null;
  };
}

interface HeroSectionProps {
  featuredVideos: FeaturedVideo[];
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

export function HeroSection({ featuredVideos }: HeroSectionProps) {
  if (featuredVideos.length === 0) {
    // Show promotional hero when no featured videos
    return (
      <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-16 lg:py-24">
          <div className="max-w-2xl">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              Share your story with the world
            </h1>
            <p className="text-lg lg:text-xl text-white/80 mb-8">
              Upload, stream, and share your videos with our powerful platform.
              Unlimited storage, HLS streaming, and creator tools.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/studio/upload"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                <Play className="w-5 h-5" />
                Start Creating
              </Link>
              <Link
                href="/trending"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 text-white rounded-lg font-semibold hover:bg-white/30 transition-colors backdrop-blur-sm"
              >
                <TrendingUp className="w-5 h-5" />
                Explore Trending
              </Link>
            </div>

            <div className="flex items-center gap-8 mt-10 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Growing community</span>
              </div>
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                <span>HLS streaming</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>Creator analytics</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const mainVideo = featuredVideos[0];
  const sideVideos = featuredVideos.slice(1, 4);

  return (
    <div className="bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-4">
          {/* Main featured video */}
          <Link
            href={`/watch/${mainVideo.slug}`}
            className="relative flex-1 aspect-video rounded-2xl overflow-hidden group"
          >
            {mainVideo.thumbnail_url ? (
              <img
                src={mainVideo.thumbnail_url}
                alt={mainVideo.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <Play className="w-16 h-16 text-gray-600" />
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Play button */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center">
                <Play className="w-10 h-10 text-gray-900 ml-1" fill="currentColor" />
              </div>
            </div>

            {/* Duration */}
            {mainVideo.duration && (
              <span className="absolute top-4 right-4 px-2 py-1 text-sm font-medium bg-black/80 text-white rounded">
                {formatDuration(mainVideo.duration)}
              </span>
            )}

            {/* Info */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <span className="inline-block px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-full mb-3">
                Featured
              </span>
              <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2 line-clamp-2">
                {mainVideo.title}
              </h2>
              <div className="flex items-center gap-3 text-gray-300 text-sm">
                <div className="flex items-center gap-2">
                  {mainVideo.channel.avatar_url ? (
                    <img
                      src={mainVideo.channel.avatar_url}
                      alt={mainVideo.channel.username}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold">
                      {mainVideo.channel.username[0]?.toUpperCase()}
                    </div>
                  )}
                  <span>{mainVideo.channel.username}</span>
                </div>
                <span>•</span>
                <span>{formatViews(mainVideo.views_count)} views</span>
              </div>
            </div>
          </Link>

          {/* Side videos */}
          {sideVideos.length > 0 && (
            <div className="hidden lg:flex flex-col gap-4 w-80">
              {sideVideos.map((video) => (
                <Link
                  key={video.id}
                  href={`/watch/${video.slug}`}
                  className="relative aspect-video rounded-xl overflow-hidden group"
                >
                  {video.thumbnail_url ? (
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                      <Play className="w-8 h-8 text-gray-600" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

                  {video.duration && (
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 text-xs font-medium bg-black/80 text-white rounded">
                      {formatDuration(video.duration)}
                    </span>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="text-sm font-medium text-white line-clamp-2">
                      {video.title}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {video.channel.username} • {formatViews(video.views_count)} views
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
