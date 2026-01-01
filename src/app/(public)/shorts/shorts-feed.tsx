"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Hls from "hls.js";
import {
  Heart,
  MessageCircle,
  Share2,
  Volume2,
  VolumeX,
  Play,
  Pause,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

interface Short {
  id: string;
  title: string;
  slug: string;
  description?: string;
  thumbnail_url?: string;
  hls_url?: string;
  duration?: number;
  views_count: number;
  likes_count: number;
  comments_count: number;
  created_at: string;
  channel: {
    id: string;
    username: string;
    avatar_url?: string;
  } | null;
}

interface ShortsFeedProps {
  initialShorts: Short[];
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function ShortPlayer({
  short,
  isActive,
  isMuted,
  onToggleMute,
}: {
  short: Short;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(short.likes_count);
  const viewTracked = useRef(false);

  // Track view
  const trackView = useCallback(() => {
    if (viewTracked.current) return;
    viewTracked.current = true;
    fetch(`/api/videos/${short.id}/view`, { method: "POST" }).catch(() => {});
  }, [short.id]);

  // Load HLS
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !short.hls_url) return;

    const handlePlay = () => {
      setIsPlaying(true);
      trackView();
    };
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });

      hls.loadSource(short.hls_url);
      hls.attachMedia(video);

      hlsRef.current = hls;
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = short.hls_url;
    }

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [short.hls_url, trackView]);

  // Handle active state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.muted = isMuted;
      video.play().catch(() => {});
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [isActive, isMuted]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  const handleLike = async () => {
    try {
      const res = await fetch(`/api/videos/${short.id}/like`, {
        method: isLiked ? "DELETE" : "POST",
      });
      if (res.ok) {
        setIsLiked(!isLiked);
        setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
      }
    } catch (err) {
      console.error("Like error:", err);
    }
  };

  return (
    <div className="relative w-full h-full bg-black">
      {/* Video */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        loop
        poster={short.thumbnail_url || undefined}
        onClick={togglePlay}
      />

      {/* Play/Pause overlay */}
      {!isPlaying && isActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 bg-black/30 rounded-full flex items-center justify-center">
            <Play className="w-8 h-8 text-white ml-1" />
          </div>
        </div>
      )}

      {/* Right sidebar actions */}
      <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6">
        {/* Like */}
        <button
          onClick={handleLike}
          className="flex flex-col items-center gap-1 text-white"
        >
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isLiked ? "bg-red-500" : "bg-black/30"
            }`}
          >
            <Heart className={`w-6 h-6 ${isLiked ? "fill-current" : ""}`} />
          </div>
          <span className="text-xs font-medium">{formatNumber(likesCount)}</span>
        </button>

        {/* Comments */}
        <Link
          href={`/watch/${short.slug}`}
          className="flex flex-col items-center gap-1 text-white"
        >
          <div className="w-12 h-12 bg-black/30 rounded-full flex items-center justify-center">
            <MessageCircle className="w-6 h-6" />
          </div>
          <span className="text-xs font-medium">{formatNumber(short.comments_count)}</span>
        </Link>

        {/* Share */}
        <button className="flex flex-col items-center gap-1 text-white">
          <div className="w-12 h-12 bg-black/30 rounded-full flex items-center justify-center">
            <Share2 className="w-6 h-6" />
          </div>
          <span className="text-xs font-medium">Share</span>
        </button>

        {/* Mute toggle */}
        <button
          onClick={onToggleMute}
          className="w-12 h-12 bg-black/30 rounded-full flex items-center justify-center text-white"
        >
          {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
        </button>
      </div>

      {/* Bottom info */}
      <div className="absolute left-0 right-16 bottom-4 px-4 text-white">
        {/* Channel */}
        {short.channel && (
          <Link
            href={`/channel/${short.channel.username}`}
            className="flex items-center gap-3 mb-3"
          >
            <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden">
              {short.channel.avatar_url ? (
                <img
                  src={short.channel.avatar_url}
                  alt={short.channel.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-medium">
                  {short.channel.username[0].toUpperCase()}
                </span>
              )}
            </div>
            <span className="font-semibold">@{short.channel.username}</span>
          </Link>
        )}

        {/* Title and description */}
        <p className="font-medium line-clamp-2">{short.title}</p>
        {short.description && (
          <p className="text-sm text-white/80 line-clamp-2 mt-1">{short.description}</p>
        )}
      </div>
    </div>
  );
}

export function ShortsFeed({ initialShorts }: ShortsFeedProps) {
  const [shorts, setShorts] = useState(initialShorts);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const goToNext = useCallback(() => {
    if (currentIndex < shorts.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, shorts.length]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        goToNext();
      } else if (e.key === "ArrowUp") {
        goToPrev();
      } else if (e.key === "m") {
        setIsMuted((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNext, goToPrev]);

  // Touch/scroll navigation
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let startY = 0;
    let isDragging = false;

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      isDragging = true;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isDragging) return;
      isDragging = false;

      const endY = e.changedTouches[0].clientY;
      const diff = startY - endY;

      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          goToNext();
        } else {
          goToPrev();
        }
      }
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [goToNext, goToPrev]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black overflow-hidden"
      style={{ top: "56px" }} // Account for header
    >
      {/* Current short */}
      <div className="w-full h-full max-w-md mx-auto">
        {shorts[currentIndex] && (
          <ShortPlayer
            key={shorts[currentIndex].id}
            short={shorts[currentIndex]}
            isActive={true}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted(!isMuted)}
          />
        )}
      </div>

      {/* Navigation buttons */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
        <button
          onClick={goToPrev}
          disabled={currentIndex === 0}
          className="w-10 h-10 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
        <button
          onClick={goToNext}
          disabled={currentIndex === shorts.length - 1}
          className="w-10 h-10 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronDown className="w-6 h-6" />
        </button>
      </div>

      {/* Progress indicator */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/30 px-3 py-1 rounded-full">
        {currentIndex + 1} / {shorts.length}
      </div>
    </div>
  );
}
