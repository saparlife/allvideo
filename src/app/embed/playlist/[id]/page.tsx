import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { PlaylistEmbedPlayer } from "./playlist-embed-player";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ start?: string }>;
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

  const { data: playlist } = await supabase
    .from("playlists")
    .select("title, description")
    .eq("id", id)
    .eq("visibility", "public")
    .single();

  if (!playlist) {
    return { title: "Playlist Not Found" };
  }

  return {
    title: playlist.title,
    description: playlist.description,
  };
}

export default async function PlaylistEmbedPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { start } = await searchParams;
  const startIndex = start ? parseInt(start, 10) : 0;

  const supabase = getPublicClient();

  // Fetch playlist with videos
  const { data: playlist, error } = await supabase
    .from("playlists")
    .select(`
      id,
      title,
      visibility,
      playlist_videos:playlist_videos (
        position,
        video:videos (
          id,
          title,
          slug,
          hls_key,
          thumbnail_key,
          thumbnail_url,
          duration,
          status,
          visibility
        )
      )
    `)
    .eq("id", id)
    .eq("visibility", "public")
    .single();

  if (error || !playlist) {
    notFound();
  }

  // Sort and filter videos
  const videos = (playlist.playlist_videos || [])
    .sort((a: any, b: any) => a.position - b.position)
    .map((pv: any) => pv.video)
    .filter((v: any) => v && v.status === "ready" && v.visibility === "public" && v.hls_key);

  if (videos.length === 0) {
    notFound();
  }

  const CDN_URL = process.env.R2_PUBLIC_URL || "https://cdn.lovsell.com";

  // Prepare video data for player
  const playlistVideos = videos.map((v: any) => ({
    id: v.id,
    title: v.title,
    hlsUrl: `${CDN_URL}/${v.hls_key}`,
    thumbnail: v.thumbnail_url || (v.thumbnail_key ? `${CDN_URL}/${v.thumbnail_key}` : undefined),
    duration: v.duration,
  }));

  return (
    <div className="fixed inset-0 bg-black">
      <PlaylistEmbedPlayer
        playlistId={id}
        playlistTitle={playlist.title}
        videos={playlistVideos}
        startIndex={Math.min(startIndex, playlistVideos.length - 1)}
      />
    </div>
  );
}
