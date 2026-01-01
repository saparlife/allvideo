"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import Hls from "hls.js";
import { Play, Volume2, VolumeX, Maximize, Star } from "lucide-react";

interface FeaturedVideoProps {
  video: {
    id: string;
    slug: string;
    title: string;
    description?: string;
    thumbnail_url?: string;
    hls_url?: string;
    duration?: number;
    views_count?: number;
    created_at: string;
  };
  channelUsername: string;
}

function formatDuration(seconds?: number): string {
  if (!seconds) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatViews(views: number): string {
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`;
  }
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`;
  }
  return views.toString();
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export function FeaturedVideo({ video, channelUsername }: FeaturedVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !video.hls_url) return;

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });

      hls.loadSource(video.hls_url);
      hls.attachMedia(videoEl);

      hlsRef.current = hls;

      return () => {
        hls.destroy();
      };
    } else if (videoEl.canPlayType("application/vnd.apple.mpegurl")) {
      videoEl.src = video.hls_url;
    }
  }, [video.hls_url]);

  const handlePlay = () => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    setShowPreview(false);
    videoEl.muted = isMuted;
    videoEl.play().catch(() => {});
    setIsPlaying(true);
  };

  const toggleMute = () => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    videoEl.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    setShowPreview(true);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 mb-3">
        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
        <span className="text-sm font-medium text-gray-700">Featured Video</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Video Player */}
        <div className="relative w-full lg:w-2/3 aspect-video bg-black rounded-xl overflow-hidden group">
          {/* Thumbnail / Preview */}
          {showPreview && video.thumbnail_url && (
            <div className="absolute inset-0 z-10">
              <img
                src={video.thumbnail_url}
                alt={video.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <button
                  onClick={handlePlay}
                  className="w-16 h-16 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-transform hover:scale-110"
                >
                  <Play className="w-7 h-7 text-gray-900 ml-1" />
                </button>
              </div>
            </div>
          )}

          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            playsInline
            onEnded={handleVideoEnded}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />

          {/* Controls overlay */}
          {!showPreview && (
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center justify-between">
                <button
                  onClick={toggleMute}
                  className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/20 rounded-full"
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>
                <Link
                  href={`/watch/${video.slug}`}
                  className="w-8 h-8 flex items-center justify-center text-white hover:bg-white/20 rounded-full"
                >
                  <Maximize className="w-5 h-5" />
                </Link>
              </div>
            </div>
          )}

          {/* Duration badge */}
          {video.duration && showPreview && (
            <span className="absolute bottom-3 right-3 z-20 px-1.5 py-0.5 bg-black/80 text-white text-xs rounded">
              {formatDuration(video.duration)}
            </span>
          )}
        </div>

        {/* Video Info */}
        <div className="flex-1 flex flex-col justify-center">
          <Link
            href={`/watch/${video.slug}`}
            className="text-xl lg:text-2xl font-bold text-gray-900 hover:text-indigo-600 transition-colors line-clamp-2 mb-3"
          >
            {video.title}
          </Link>

          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <span>{formatViews(video.views_count || 0)} views</span>
            <span>•</span>
            <span>{formatTimeAgo(video.created_at)}</span>
          </div>

          {video.description && (
            <p className="text-gray-600 line-clamp-3 mb-4">
              {video.description}
            </p>
          )}

          <Link
            href={`/watch/${video.slug}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-sm font-medium transition-colors w-fit"
          >
            <Play className="w-4 h-4" />
            Watch Now
          </Link>
        </div>
      </div>
    </div>
  );
}
