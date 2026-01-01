"use client";

import { useRef, useState, useCallback } from "react";
import {
  MediaPlayer,
  MediaProvider,
  Poster,
  type MediaPlayerInstance,
} from "@vidstack/react";
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";
import { ChevronLeft, ChevronRight, List, X, Play } from "lucide-react";

interface VideoItem {
  id: string;
  title: string;
  hlsUrl: string;
  thumbnail?: string;
  duration?: number;
}

interface PlaylistEmbedPlayerProps {
  playlistId: string;
  playlistTitle: string;
  videos: VideoItem[];
  startIndex?: number;
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

export function PlaylistEmbedPlayer({
  playlistId,
  playlistTitle,
  videos,
  startIndex = 0,
}: PlaylistEmbedPlayerProps) {
  const playerRef = useRef<MediaPlayerInstance>(null);
  const viewTrackedRef = useRef<Set<string>>(new Set());

  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const currentVideo = videos[currentIndex];

  // Track view when video starts playing
  const trackView = useCallback((videoId: string) => {
    if (viewTrackedRef.current.has(videoId)) return;
    viewTrackedRef.current.add(videoId);
    fetch(`/api/videos/${videoId}/view`, { method: "POST" }).catch(() => {});
  }, []);

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const selectVideo = (index: number) => {
    setCurrentIndex(index);
    setShowPlaylist(false);
  };

  const handlePlay = () => {
    setIsPlaying(true);
    if (currentVideo) {
      trackView(currentVideo.id);
    }
  };

  const handleEnded = () => {
    // Auto-play next video
    if (currentIndex < videos.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  if (!currentVideo) {
    return (
      <div className="flex items-center justify-center h-full text-white">
        <p>No videos available</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black flex">
      {/* Video Player */}
      <div className={`relative flex-1 ${showPlaylist ? "hidden sm:block" : ""}`}>
        <MediaPlayer
          ref={playerRef}
          key={currentVideo.id}
          src={currentVideo.hlsUrl}
          viewType="video"
          streamType="on-demand"
          logLevel="warn"
          crossOrigin
          playsInline
          autoPlay
          title={currentVideo.title}
          onPlay={handlePlay}
          onPause={() => setIsPlaying(false)}
          onEnded={handleEnded}
          className="w-full h-full"
        >
          <MediaProvider>
            {currentVideo.thumbnail && (
              <Poster
                className="absolute inset-0 block h-full w-full object-cover opacity-0 transition-opacity data-[visible]:opacity-100"
                src={currentVideo.thumbnail}
                alt={currentVideo.title}
              />
            )}
          </MediaProvider>

          <DefaultVideoLayout icons={defaultLayoutIcons} />
        </MediaPlayer>

        {/* Top bar with playlist info */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-3 pointer-events-none z-10">
          <div className="flex items-center gap-2 text-white text-sm">
            <span className="font-medium truncate">{playlistTitle}</span>
            <span className="opacity-70">•</span>
            <span className="opacity-70">{currentIndex + 1}/{videos.length}</span>
          </div>
          <p className="text-white/80 text-xs mt-1 truncate">{currentVideo.title}</p>
        </div>

        {/* Navigation controls */}
        <div className="absolute bottom-16 left-2 right-2 flex items-center justify-between pointer-events-none z-10">
          <button
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className="pointer-events-auto w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goToNext}
            disabled={currentIndex === videos.length - 1}
            className="pointer-events-auto w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Playlist toggle button */}
        <button
          onClick={() => setShowPlaylist(!showPlaylist)}
          className="absolute top-3 right-3 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded flex items-center justify-center transition-colors z-20"
        >
          <List className="w-4 h-4" />
        </button>
      </div>

      {/* Playlist sidebar */}
      {showPlaylist && (
        <div className="absolute sm:relative inset-0 sm:inset-auto sm:w-72 bg-gray-900 flex flex-col z-30">
          <div className="flex items-center justify-between p-3 border-b border-gray-800">
            <div>
              <h3 className="font-medium text-white text-sm truncate">{playlistTitle}</h3>
              <p className="text-gray-400 text-xs">{videos.length} videos</p>
            </div>
            <button
              onClick={() => setShowPlaylist(false)}
              className="w-8 h-8 hover:bg-gray-800 text-gray-400 hover:text-white rounded flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {videos.map((video, index) => (
              <button
                key={video.id}
                onClick={() => selectVideo(index)}
                className={`w-full flex items-center gap-2 p-2 text-left hover:bg-gray-800 transition-colors ${
                  index === currentIndex ? "bg-gray-800" : ""
                }`}
              >
                <span className="w-6 text-center text-gray-500 text-xs shrink-0">
                  {index === currentIndex && isPlaying ? (
                    <Play className="w-3 h-3 mx-auto text-white fill-current" />
                  ) : (
                    index + 1
                  )}
                </span>
                <div className="relative w-20 aspect-video bg-gray-800 rounded overflow-hidden shrink-0">
                  {video.thumbnail ? (
                    <img
                      src={video.thumbnail}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="w-4 h-4 text-gray-600" />
                    </div>
                  )}
                  {video.duration && (
                    <span className="absolute bottom-0.5 right-0.5 px-1 py-0.5 bg-black/80 text-white text-[10px] rounded">
                      {formatDuration(video.duration)}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs line-clamp-2 ${index === currentIndex ? "text-white" : "text-gray-300"}`}>
                    {video.title}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
