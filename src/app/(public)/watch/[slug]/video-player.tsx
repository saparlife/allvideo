"use client";

import { useRef, useEffect } from "react";
import {
  MediaPlayer,
  MediaProvider,
  Poster,
  Track,
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
  videoId: string;
  title?: string;
  subtitlesUrl?: string;
}

export function VideoPlayer({ src, poster, videoId, title, subtitlesUrl }: VideoPlayerProps) {
  const playerRef = useRef<MediaPlayerInstance>(null);
  const viewTracked = useRef(false);

  const trackView = async () => {
    if (viewTracked.current) return;
    viewTracked.current = true;
    try {
      await fetch(`/api/videos/${videoId}/view`, { method: "POST" });
    } catch (e) {
      // Ignore errors
    }
  };

  return (
    <MediaPlayer
      ref={playerRef}
      src={src}
      viewType="video"
      streamType="on-demand"
      logLevel="warn"
      crossOrigin
      playsInline
      title={title}
      onPlay={trackView}
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
        slots={{
          // Quality selector is built-in to DefaultVideoLayout
        }}
      />
    </MediaPlayer>
  );
}
