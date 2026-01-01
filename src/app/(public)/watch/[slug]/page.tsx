import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { VideoPlayer } from "./video-player";
import { VideoInfo } from "./video-info";
import { VideoComments } from "./video-comments";
import { RelatedVideos } from "./related-videos";
import type { Metadata } from "next";

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || "https://cdn.lovsell.com";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getVideo(slug: string) {
  const supabase = await createClient();

  // Try to find by slug first, then by ID
  let query = (supabase as any)
    .from("videos")
    .select(
      `
      id,
      title,
      description,
      slug,
      hls_key,
      thumbnail_key,
      duration,
      views_count,
      likes_count,
      comments_count,
      created_at,
      category_id,
      tags,
      user_id,
      users:user_id (
        id,
        username,
        email,
        avatar_url,
        subscribers_count
      )
    `
    )
    .eq("status", "ready");

  // Check if slug looks like a UUID
  const isUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      slug
    );

  if (isUUID) {
    query = query.eq("id", slug);
  } else {
    query = query.eq("slug", slug);
  }

  const { data, error } = await query.single();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const video = await getVideo(slug);

  if (!video) {
    return {
      title: "Video not found",
    };
  }

  return {
    title: video.title,
    description: video.description?.slice(0, 160) || `Watch ${video.title} on UnlimVideo`,
    openGraph: {
      title: video.title,
      description: video.description?.slice(0, 160),
      type: "video.other",
      videos: video.hls_key
        ? [
            {
              url: `${CDN_URL}/${video.hls_key}`,
              type: "application/x-mpegURL",
            },
          ]
        : undefined,
      images: video.thumbnail_key
        ? [
            {
              url: `${CDN_URL}/${video.thumbnail_key}`,
              width: 1280,
              height: 720,
            },
          ]
        : undefined,
    },
  };
}

export default async function WatchPage({ params }: Props) {
  const { slug } = await params;
  const t = await getTranslations("video");
  const video = await getVideo(slug);

  if (!video) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if user liked the video
  let isLiked = false;
  let isSubscribed = false;

  if (user) {
    const [likeCheck, subCheck] = await Promise.all([
      (supabase as any)
        .from("likes")
        .select("id")
        .eq("user_id", user.id)
        .eq("video_id", video.id)
        .single(),
      (supabase as any)
        .from("channel_subscriptions")
        .select("id")
        .eq("subscriber_id", user.id)
        .eq("channel_id", video.user_id)
        .single(),
    ]);
    isLiked = !!likeCheck.data;
    isSubscribed = !!subCheck.data;
  }

  const hlsUrl = video.hls_key ? `${CDN_URL}/${video.hls_key}` : null;
  const thumbnailUrl = video.thumbnail_key
    ? `${CDN_URL}/${video.thumbnail_key}`
    : null;

  return (
    <div className="max-w-[1800px] mx-auto px-4 py-6">
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Video player */}
          <div className="bg-black rounded-xl overflow-hidden aspect-video">
            {hlsUrl ? (
              <VideoPlayer
                src={hlsUrl}
                poster={thumbnailUrl || undefined}
                videoId={video.id}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                Video not available
              </div>
            )}
          </div>

          {/* Video info */}
          <VideoInfo
            video={{
              id: video.id,
              title: video.title,
              description: video.description,
              views_count: video.views_count || 0,
              likes_count: video.likes_count || 0,
              created_at: video.created_at,
              tags: video.tags,
              channel: video.users
                ? {
                    id: video.users.id,
                    username: video.users.username || video.users.id,
                    avatar_url: video.users.avatar_url,
                    subscribers_count: video.users.subscribers_count || 0,
                  }
                : null,
            }}
            isLiked={isLiked}
            isSubscribed={isSubscribed}
            currentUserId={user?.id}
          />

          {/* Comments */}
          <div className="mt-6">
            <Suspense
              fallback={
                <div className="animate-pulse space-y-4">
                  <div className="h-6 w-32 bg-gray-200 rounded" />
                  <div className="h-20 bg-gray-200 rounded" />
                </div>
              }
            >
              <VideoComments
                videoId={video.id}
                commentsCount={video.comments_count || 0}
                currentUserId={user?.id}
              />
            </Suspense>
          </div>
        </div>

        {/* Related videos sidebar */}
        <aside className="xl:w-[400px] shrink-0">
          <Suspense
            fallback={
              <div className="space-y-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex gap-2 animate-pulse">
                    <div className="w-40 aspect-video bg-gray-200 rounded-lg shrink-0" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            }
          >
            <RelatedVideos
              currentVideoId={video.id}
              categoryId={video.category_id}
              channelId={video.user_id}
            />
          </Suspense>
        </aside>
      </div>
    </div>
  );
}
