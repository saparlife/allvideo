"use client";

import { useRef } from "react";
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

interface EmbedPlayerProps {
  src: string;
  poster?: string;
  videoId: string;
  title?: string;
}

export function EmbedPlayer({ src, poster, videoId, title }: EmbedPlayerProps) {
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
      autoPlay
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
      </MediaProvider>

      <DefaultVideoLayout icons={defaultLayoutIcons} />
    </MediaPlayer>
  );
}
