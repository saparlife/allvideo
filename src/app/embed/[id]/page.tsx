import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { EmbedPlayer } from "./embed-player";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ wm?: string }>;
}

// Create a public Supabase client (no auth required for embed)
function getPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = getPublicClient();

  const { data: video } = await supabase
    .from("videos")
    .select("title, thumbnail_key")
    .eq("id", id)
    .eq("status", "ready")
    .single();

  if (!video) {
    return { title: "Video Not Found" };
  }

  const thumbnailUrl = video.thumbnail_key
    ? `${process.env.R2_PUBLIC_URL}/${video.thumbnail_key}`
    : undefined;

  return {
    title: video.title,
    openGraph: {
      title: video.title,
      type: "video.other",
      images: thumbnailUrl ? [thumbnailUrl] : [],
    },
  };
}

export default async function EmbedPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { wm } = await searchParams;
  const supabase = getPublicClient();

  const { data: video } = await supabase
    .from("videos")
    .select("id, title, hls_key, thumbnail_key, status")
    .eq("id", id)
    .eq("status", "ready")
    .single();

  if (!video || !video.hls_key) {
    notFound();
  }

  const hlsUrl = `${process.env.R2_PUBLIC_URL}/${video.hls_key}`;
  const thumbnailUrl = video.thumbnail_key
    ? `${process.env.R2_PUBLIC_URL}/${video.thumbnail_key}`
    : undefined;

  // Decode watermark if provided (URL encoded)
  const watermark = wm ? decodeURIComponent(wm) : undefined;

  return (
    <div className="fixed inset-0 bg-black">
      <EmbedPlayer
        src={hlsUrl}
        poster={thumbnailUrl}
        videoId={id}
        title={video.title}
        watermark={watermark}
      />
    </div>
  );
}
