import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Lock, Globe, Users, Play, Share2 } from "lucide-react";
import { VideoCard } from "@/components/public/video-card";
import { PlaylistShareButton } from "./playlist-share-button";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: playlist } = await (supabase as any)
    .from("playlists")
    .select("title, description, visibility")
    .eq("id", id)
    .single();

  if (!playlist || playlist.visibility !== "public") {
    return { title: "Playlist not found" };
  }

  return {
    title: `${playlist.title} - UnlimVideo`,
    description: playlist.description || `Watch the ${playlist.title} playlist`,
  };
}

async function PlaylistContent({ id }: { id: string }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: playlist, error } = await (supabase as any)
    .from("playlists")
    .select(`
      id,
      title,
      description,
      visibility,
      created_at,
      updated_at,
      user_id,
      user:users!playlists_user_id_fkey (
        id,
        username,
        avatar_url
      ),
      playlist_videos:playlist_videos (
        id,
        position,
        video:videos (
          id,
          title,
          slug,
          thumbnail_url,
          duration,
          views_count,
          created_at,
          visibility,
          user:users!videos_user_id_fkey (
            id,
            username,
            avatar_url
          )
        )
      )
    `)
    .eq("id", id)
    .single();

  if (error || !playlist) {
    notFound();
  }

  // Check visibility
  const isOwner = user?.id === playlist.user_id;
  if (playlist.visibility !== "public" && !isOwner) {
    notFound();
  }

  // Sort videos by position and filter out private videos (unless owner)
  const videos = (playlist.playlist_videos || [])
    .sort((a: any, b: any) => a.position - b.position)
    .map((pv: any) => pv.video)
    .filter((v: any) => v && (v.visibility === "public" || isOwner));

  const visibilityIcon =
    playlist.visibility === "private" ? (
      <Lock className="h-4 w-4" />
    ) : playlist.visibility === "unlisted" ? (
      <Users className="h-4 w-4" />
    ) : (
      <Globe className="h-4 w-4" />
    );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Playlist Header */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        {/* Playlist Thumbnail */}
        <div className="relative w-full md:w-80 aspect-video bg-gray-100 rounded-lg overflow-hidden shrink-0">
          {videos.length > 0 && videos[0].thumbnail_url ? (
            <img
              src={videos[0].thumbnail_url}
              alt={playlist.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Play className="h-12 w-12 text-gray-400" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="text-center text-white">
              <Play className="h-10 w-10 mx-auto mb-2" />
              <p className="font-medium">
                {videos.length} video{videos.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Playlist Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
            {visibilityIcon}
            <span className="capitalize">{playlist.visibility}</span>
            <span>•</span>
            <span>Playlist</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            {playlist.title}
          </h1>
          {playlist.description && (
            <p className="text-gray-600 mb-4">{playlist.description}</p>
          )}
          <div className="flex items-center gap-4">
            <Link
              href={`/channel/${playlist.user?.username}`}
              className="flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium">
                {playlist.user?.avatar_url ? (
                  <img
                    src={playlist.user.avatar_url}
                    alt={playlist.user.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  playlist.user?.username?.[0]?.toUpperCase()
                )}
              </div>
              <span className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                {playlist.user?.username}
              </span>
            </Link>

            {playlist.visibility === "public" && (
              <PlaylistShareButton
                playlistId={playlist.id}
                playlistTitle={playlist.title}
              />
            )}
          </div>
        </div>
      </div>

      {/* Videos */}
      {videos.length === 0 ? (
        <div className="text-center py-12">
          <Play className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">This playlist is empty</p>
        </div>
      ) : (
        <div className="space-y-4">
          {videos.map((video: any, index: number) => (
            <Link
              key={video.id}
              href={`/watch/${video.slug}?list=${playlist.id}`}
              className="flex gap-4 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <span className="w-8 text-center text-gray-500 font-medium self-center">
                {index + 1}
              </span>
              <div className="relative w-40 aspect-video bg-gray-100 rounded-lg overflow-hidden shrink-0">
                {video.thumbnail_url ? (
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                {video.duration && (
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 text-white text-xs rounded">
                    {formatDuration(video.duration)}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                  {video.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {video.user?.username}
                </p>
                <p className="text-sm text-gray-500">
                  {video.views_count?.toLocaleString() || 0} views
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default async function PlaylistPage({ params }: Props) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="flex flex-col md:flex-row gap-6 mb-8">
              <div className="w-full md:w-80 aspect-video bg-gray-200 rounded-lg" />
              <div className="flex-1 space-y-4">
                <div className="h-4 w-24 bg-gray-200 rounded" />
                <div className="h-8 w-64 bg-gray-200 rounded" />
                <div className="h-4 w-full bg-gray-200 rounded" />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <PlaylistContent id={id} />
    </Suspense>
  );
}
