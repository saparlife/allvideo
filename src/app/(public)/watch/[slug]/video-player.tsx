"use client";

import { useRef, useEffect, useState } from "react";
import Hls from "hls.js";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  videoId: string;
}

export function VideoPlayer({ src, poster, videoId }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const viewTracked = useRef(false);
  const [quality, setQuality] = useState<number>(-1);
  const [availableQualities, setAvailableQualities] = useState<
    { height: number; index: number }[]
  >([]);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const trackView = async () => {
      if (viewTracked.current) return;
      viewTracked.current = true;
      try {
        await fetch(`/api/videos/${videoId}/view`, { method: "POST" });
      } catch (e) {
        // Ignore errors
      }
    };

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
      });

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const qualities = hls.levels.map((level, index) => ({
          height: level.height,
          index,
        }));
        setAvailableQualities(qualities.sort((a, b) => b.height - a.height));
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        setQuality(data.level);
      });

      hlsRef.current = hls;

      video.addEventListener("play", trackView);

      return () => {
        video.removeEventListener("play", trackView);
        hls.destroy();
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      video.addEventListener("play", trackView);

      return () => {
        video.removeEventListener("play", trackView);
      };
    }
  }, [src, videoId]);

  const handleQualityChange = (levelIndex: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIndex;
      setQuality(levelIndex);
    }
    setShowControls(false);
  };

  const getQualityLabel = (height: number) => {
    if (height >= 2160) return "4K";
    if (height >= 1440) return "2K";
    if (height >= 1080) return "1080p";
    if (height >= 720) return "720p";
    if (height >= 480) return "480p";
    if (height >= 360) return "360p";
    return `${height}p`;
  };

  return (
    <div className="relative w-full h-full group">
      <video
        ref={videoRef}
        className="w-full h-full"
        poster={poster}
        controls
        playsInline
        preload="metadata"
      />

      {/* Quality selector */}
      {availableQualities.length > 1 && (
        <div className="absolute bottom-16 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="relative">
            <button
              onClick={() => setShowControls(!showControls)}
              className="px-3 py-1.5 bg-black/70 text-white text-sm rounded-lg hover:bg-black/90 transition-colors cursor-pointer"
            >
              {quality === -1
                ? "Auto"
                : getQualityLabel(
                    availableQualities.find((q) => q.index === quality)
                      ?.height || 0
                  )}
            </button>

            {showControls && (
              <div className="absolute bottom-full right-0 mb-2 py-2 bg-black/90 rounded-lg min-w-[100px]">
                <button
                  onClick={() => handleQualityChange(-1)}
                  className={`w-full px-4 py-1.5 text-left text-sm transition-colors cursor-pointer ${
                    quality === -1
                      ? "text-indigo-400"
                      : "text-white hover:text-indigo-400"
                  }`}
                >
                  Auto
                </button>
                {availableQualities.map((q) => (
                  <button
                    key={q.index}
                    onClick={() => handleQualityChange(q.index)}
                    className={`w-full px-4 py-1.5 text-left text-sm transition-colors cursor-pointer ${
                      quality === q.index
                        ? "text-indigo-400"
                        : "text-white hover:text-indigo-400"
                    }`}
                  >
                    {getQualityLabel(q.height)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
