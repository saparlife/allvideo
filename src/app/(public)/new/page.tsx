import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { VideoCard } from "@/components/public/video-card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New Videos - UnlimVideo",
  description: "Discover the latest videos uploaded to UnlimVideo",
};

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || "https://cdn.1app.to";

interface Video {
  id: string;
  title: string;
  slug: string;
  thumbnail_key: string | null;
  thumbnail_url: string | null;
  duration: number | null;
  views_count: number;
  created_at: string;
  user: {
    id: string;
    username: string;
    avatar_url: string | null;
  } | null;
}

export default async function NewVideosPage() {
  const t = await getTranslations("common");
  const supabase = await createClient();

  // Get videos from the last 7 days, sorted by newest first
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: videos } = await (supabase as any)
    .from("videos")
    .select(`
      id,
      title,
      slug,
      thumbnail_key,
      thumbnail_url,
      duration,
      views_count,
      created_at,
      user:users!videos_user_id_fkey (
        id,
        username,
        avatar_url
      )
    `)
    .in("status", ["ready"])
    .eq("visibility", "public")
    .gte("created_at", sevenDaysAgo.toISOString())
    .order("created_at", { ascending: false })
    .limit(60);

  const typedVideos = (videos || []) as Video[];

  // Group videos by date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayVideos = typedVideos.filter((v) => {
    const date = new Date(v.created_at);
    date.setHours(0, 0, 0, 0);
    return date.getTime() === today.getTime();
  });

  const yesterdayVideos = typedVideos.filter((v) => {
    const date = new Date(v.created_at);
    date.setHours(0, 0, 0, 0);
    return date.getTime() === yesterday.getTime();
  });

  const earlierVideos = typedVideos.filter((v) => {
    const date = new Date(v.created_at);
    date.setHours(0, 0, 0, 0);
    return date.getTime() < yesterday.getTime();
  });

  const renderVideoGrid = (videoList: Video[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {videoList.map((video) => (
        <VideoCard
          key={video.id}
          video={{
            id: video.id,
            title: video.title,
            slug: video.slug,
            thumbnail_url: video.thumbnail_url || (video.thumbnail_key ? `${CDN_URL}/${video.thumbnail_key}` : null),
            duration: video.duration,
            views_count: video.views_count,
            created_at: video.created_at,
            channel: video.user
              ? {
                  username: video.user.username,
                  avatar_url: video.user.avatar_url,
                }
              : undefined,
          }}
        />
      ))}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">New Videos</h1>
        <p className="text-gray-600">
          The latest videos uploaded in the past 7 days
        </p>
      </div>

      {typedVideos.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            No new videos yet
          </h2>
          <p className="text-gray-600">
            Check back later for the latest uploads
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {todayVideos.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                Today
                <span className="text-sm font-normal text-gray-500">
                  ({todayVideos.length})
                </span>
              </h2>
              {renderVideoGrid(todayVideos)}
            </section>
          )}

          {yesterdayVideos.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Yesterday
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({yesterdayVideos.length})
                </span>
              </h2>
              {renderVideoGrid(yesterdayVideos)}
            </section>
          )}

          {earlierVideos.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Earlier this week
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({earlierVideos.length})
                </span>
              </h2>
              {renderVideoGrid(earlierVideos)}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
