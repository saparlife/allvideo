"use client";

import { useEffect, useRef } from "react";
import Hls from "hls.js";

interface EmbedPlayerProps {
  src: string;
  poster?: string;
  videoId: string;
}

export function EmbedPlayer({ src, poster, videoId }: EmbedPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const viewTracked = useRef(false);

  // Track view when video starts playing
  const trackView = () => {
    if (viewTracked.current) return;
    viewTracked.current = true;

    fetch(`/api/videos/${videoId}/view`, { method: "POST" }).catch(() => {});
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Track view on play
    video.addEventListener("play", trackView);

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });

      hlsRef.current = hls;

      return () => {
        video.removeEventListener("play", trackView);
        hls.destroy();
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
    }

    return () => {
      video.removeEventListener("play", trackView);
    };
  }, [src, videoId]);

  return (
    <video
      ref={videoRef}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "contain",
        background: "#000",
      }}
      controls
      poster={poster}
      playsInline
      autoPlay
    />
  );
}
