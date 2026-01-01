"use client";

import { useEffect, useRef, useState } from "react";
import {
  MediaPlayer,
  MediaProvider,
  Poster,
  Track,
  useMediaState,
  type MediaPlayerInstance,
} from "@vidstack/react";
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  subtitlesUrl?: string;
  watermark?: string;
  onTimeUpdate?: (currentTime: number) => void;
  onEnded?: () => void;
  autoPlay?: boolean;
}

// Watermark overlay component
function WatermarkOverlay({ text }: { text: string }) {
  if (!text) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Multiple watermarks across the video */}
      <div className="absolute top-4 left-4 text-white/20 text-sm font-mono select-none">
        {text}
      </div>
      <div className="absolute top-4 right-4 text-white/20 text-sm font-mono select-none">
        {text}
      </div>
      <div className="absolute bottom-16 left-4 text-white/20 text-sm font-mono select-none">
        {text}
      </div>
      <div className="absolute bottom-16 right-4 text-white/20 text-sm font-mono select-none">
        {text}
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/10 text-lg font-mono select-none rotate-[-30deg]">
        {text}
      </div>
    </div>
  );
}

export function VideoPlayer({
  src,
  poster,
  title,
  subtitlesUrl,
  watermark,
  onTimeUpdate,
  onEnded,
  autoPlay = false,
}: VideoPlayerProps) {
  const playerRef = useRef<MediaPlayerInstance>(null);

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      <MediaPlayer
        ref={playerRef}
        src={src}
        viewType="video"
        streamType="on-demand"
        logLevel="warn"
        crossOrigin
        playsInline
        autoPlay={autoPlay}
        title={title}
        poster={poster}
        onTimeUpdate={(e) => {
          if (onTimeUpdate) {
            onTimeUpdate(e.currentTime);
          }
        }}
        onEnded={onEnded}
        className="w-full h-full"
      >
        <MediaProvider>
          {poster && (
            <Poster
              className="absolute inset-0 block h-full w-full rounded-lg object-cover opacity-0 transition-opacity data-[visible]:opacity-100"
              src={poster}
              alt={title || "Video poster"}
            />
          )}
          {subtitlesUrl && (
            <Track
              src={subtitlesUrl}
              kind="subtitles"
              label="Auto"
              default
            />
          )}
        </MediaProvider>

        <DefaultVideoLayout
          icons={defaultLayoutIcons}
          thumbnails={undefined}
        />
      </MediaPlayer>

      {/* Watermark overlay */}
      {watermark && <WatermarkOverlay text={watermark} />}
    </div>
  );
}

// Minimal player for embeds
export function EmbedPlayer({
  src,
  poster,
  title,
  watermark,
}: {
  src: string;
  poster?: string;
  title?: string;
  watermark?: string;
}) {
  return (
    <div className="relative w-full h-full bg-black">
      <MediaPlayer
        src={src}
        viewType="video"
        streamType="on-demand"
        logLevel="warn"
        crossOrigin
        playsInline
        title={title}
        poster={poster}
        className="w-full h-full"
      >
        <MediaProvider>
          {poster && (
            <Poster
              className="absolute inset-0 block h-full w-full object-cover opacity-0 transition-opacity data-[visible]:opacity-100"
              src={poster}
              alt={title || "Video"}
            />
          )}
        </MediaProvider>

        <DefaultVideoLayout icons={defaultLayoutIcons} />
      </MediaPlayer>

      {watermark && <WatermarkOverlay text={watermark} />}
    </div>
  );
}
