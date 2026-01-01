"use client";

import { useRef, useEffect, useCallback } from "react";
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
  watermark?: string;
}

// Canvas-based watermark - harder to remove than CSS
function CanvasWatermark({ text }: { text: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const positionRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number | undefined>(undefined);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !text) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Match canvas size to container
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Configure text style
    ctx.font = "14px monospace";
    ctx.textBaseline = "middle";

    // Draw multiple watermarks in a grid pattern with rotation
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = "#ffffff";

    // Diagonal pattern across entire canvas
    const stepX = 200;
    const stepY = 120;

    for (let y = -50; y < rect.height + 100; y += stepY) {
      for (let x = -100; x < rect.width + 200; x += stepX) {
        ctx.save();
        ctx.translate(x + positionRef.current.x, y + positionRef.current.y);
        ctx.rotate(-25 * Math.PI / 180);
        ctx.fillText(text, 0, 0);
        ctx.restore();
      }
    }
    ctx.restore();

    // Draw corner watermarks (more visible)
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = "#ffffff";

    // Top-left
    ctx.fillText(text, 12, 20);

    // Top-right
    const textWidth = ctx.measureText(text).width;
    ctx.fillText(text, rect.width - textWidth - 12, 20);

    // Bottom-left (above controls)
    ctx.fillText(text, 12, rect.height - 60);

    // Bottom-right (above controls)
    ctx.fillText(text, rect.width - textWidth - 12, rect.height - 60);

    // Moving center watermark
    ctx.globalAlpha = 0.12;
    ctx.font = "18px monospace";
    ctx.save();
    const centerX = rect.width / 2 + Math.sin(Date.now() / 3000) * 50;
    const centerY = rect.height / 2 + Math.cos(Date.now() / 4000) * 30;
    ctx.translate(centerX, centerY);
    ctx.rotate(-30 * Math.PI / 180);
    const largeTextWidth = ctx.measureText(text).width;
    ctx.fillText(text, -largeTextWidth / 2, 0);
    ctx.restore();

  }, [text]);

  useEffect(() => {
    if (!text) return;

    // Slowly move the pattern
    const animate = () => {
      positionRef.current.x = Math.sin(Date.now() / 10000) * 20;
      positionRef.current.y = Math.cos(Date.now() / 12000) * 15;
      draw();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Handle resize
    const handleResize = () => draw();
    window.addEventListener("resize", handleResize);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener("resize", handleResize);
    };
  }, [text, draw]);

  if (!text) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
      style={{ mixBlendMode: "difference" }}
    />
  );
}

export function EmbedPlayer({ src, poster, videoId, title, watermark }: EmbedPlayerProps) {
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
    <div className="relative w-full h-full">
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

      {/* Canvas watermark - harder to remove */}
      {watermark && <CanvasWatermark text={watermark} />}
    </div>
  );
}
