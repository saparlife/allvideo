import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { VideoCard } from "@/components/public/video-card";
import { ChannelHeader } from "./channel-header";
import { VideoSort } from "@/components/public/video-sort";
import { FeaturedVideo } from "./featured-video";
import type { Metadata } from "next";

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || "https://cdn.1app.to";

interface Props {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string; sort?: string }>;
}

async function getChannel(usernameOrId: string) {
  const supabase = await createClient();

  // Check if it's a UUID (search by id) or username
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(usernameOrId);

  const { data, error } = await (supabase as any)
    .from("users")
    .select(
      `
      id,
      username,
      email,
      avatar_url,
      banner_url,
      bio,
      website,
      social_links,
      subscribers_count,
      created_at,
      featured_video_id
    `
    )
    .eq(isUUID ? "id" : "username", usernameOrId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const channel = await getChannel(username);

  if (!channel) {
    return {
      title: "Channel not found",
    };
  }

  return {
    title: `${channel.username}'s Channel`,
    description: channel.bio || `Watch videos from ${channel.username}`,
    openGraph: {
      title: `${channel.username}'s Channel`,
      description: channel.bio,
      images: channel.avatar_url ? [{ url: channel.avatar_url }] : undefined,
    },
  };
}

async function ChannelVideos({ channelId, sort = "recent" }: { channelId: string; sort?: string }) {
  const supabase = await createClient();
  const t = await getTranslations("channel");

  let query = (supabase as any)
    .from("videos")
    .select(
      `
      id,
      title,
      slug,
      thumbnail_key,
      thumbnail_url,
      duration,
      views_count,
      created_at
    `
    )
    .eq("user_id", channelId)
    .or("status.eq.ready,status.eq.ready")
    .eq("visibility", "public");

  // Apply sorting
  switch (sort) {
    case "popular":
      query = query.order("views_count", { ascending: false });
      break;
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "recent":
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  const { data: videos } = await query.limit(50);

  const videoList = videos || [];

  if (videoList.length === 0) {
    return (
      <div className="text-center py-12">
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
        <p className="text-gray-600">{t("noVideos")}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {videoList.map((video: any) => (
        <VideoCard
          key={video.id}
          video={{
            id: video.id,
            slug: video.slug || video.id,
            title: video.title,
            thumbnail_url: video.thumbnail_url || (video.thumbnail_key ? `${CDN_URL}/${video.thumbnail_key}` : null),
            duration: video.duration,
            views_count: video.views_count || 0,
            created_at: video.created_at,
          }}
        />
      ))}
    </div>
  );
}

export default async function ChannelPage({ params, searchParams }: Props) {
  const { username } = await params;
  const { tab = "videos", sort = "recent" } = await searchParams;
  const t = await getTranslations("channel");

  const channel = await getChannel(username);

  if (!channel) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if current user is subscribed
  let isSubscribed = false;
  if (user) {
    const { data } = await (supabase as any)
      .from("channel_subscriptions")
      .select("id")
      .eq("subscriber_id", user.id)
      .eq("channel_id", channel.id)
      .single();
    isSubscribed = !!data;
  }

  // Get total views
  const { data: viewsData } = await (supabase as any)
    .from("videos")
    .select("views_count")
    .eq("user_id", channel.id)
    .eq("status", "ready");

  const totalViews = (viewsData || []).reduce(
    (sum: number, v: any) => sum + (v.views_count || 0),
    0
  );

  const isOwner = user?.id === channel.id;

  // Fetch featured video if exists
  let featuredVideo = null;
  if (channel.featured_video_id) {
    const { data: fv } = await (supabase as any)
      .from("videos")
      .select(`
        id,
        title,
        slug,
        description,
        thumbnail_key,
        thumbnail_url,
        hls_key,
        duration,
        views_count,
        created_at
      `)
      .eq("id", channel.featured_video_id)
      .eq("status", "ready")
      .eq("visibility", "public")
      .single();

    if (fv) {
      featuredVideo = {
        ...fv,
        thumbnail_url: fv.thumbnail_url || (fv.thumbnail_key ? `${CDN_URL}/${fv.thumbnail_key}` : null),
        hls_url: fv.hls_key ? `${CDN_URL}/${fv.hls_key}` : null,
      };
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <ChannelHeader
        channel={{
          id: channel.id,
          username: channel.username,
          avatar_url: channel.avatar_url,
          banner_url: channel.banner_url,
          bio: channel.bio,
          website: channel.website,
          subscribers_count: channel.subscribers_count || 0,
          total_views: totalViews,
          joined_at: channel.created_at,
        }}
        isSubscribed={isSubscribed}
        isOwner={isOwner}
        currentUserId={user?.id}
      />

      {/* Featured Video */}
      {featuredVideo && tab === "videos" && (
        <div className="px-4 py-6 border-b">
          <FeaturedVideo video={featuredVideo} channelUsername={channel.username} />
        </div>
      )}

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-6 px-4">
          <a
            href={`/channel/${username}`}
            className={`py-4 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              tab === "videos"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {t("videos")}
          </a>
          <a
            href={`/channel/${username}?tab=about`}
            className={`py-4 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              tab === "about"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {t("about")}
          </a>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {tab === "videos" && (
          <>
            <div className="flex justify-end mb-4">
              <VideoSort value={sort} />
            </div>
            <Suspense
              fallback={
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-video bg-gray-200 rounded-xl" />
                      <div className="mt-3 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              }
            >
              <ChannelVideos channelId={channel.id} sort={sort} />
            </Suspense>
          </>
        )}

        {tab === "about" && (
          <div className="max-w-2xl">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {t("about")}
            </h2>
            {channel.bio ? (
              <p className="text-gray-700 whitespace-pre-wrap">{channel.bio}</p>
            ) : (
              <p className="text-gray-500">No description</p>
            )}

            {/* Social Links */}
            {channel.social_links && Object.keys(channel.social_links).some((key) => channel.social_links[key]) && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Links</h3>
                <div className="flex flex-wrap gap-3">
                  {channel.social_links.twitter && (
                    <a
                      href={`https://twitter.com/${channel.social_links.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                      @{channel.social_links.twitter}
                    </a>
                  )}
                  {channel.social_links.instagram && (
                    <a
                      href={`https://instagram.com/${channel.social_links.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                      </svg>
                      @{channel.social_links.instagram}
                    </a>
                  )}
                  {channel.social_links.youtube && (
                    <a
                      href={`https://youtube.com/@${channel.social_links.youtube}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                      @{channel.social_links.youtube}
                    </a>
                  )}
                  {channel.social_links.tiktok && (
                    <a
                      href={`https://tiktok.com/@${channel.social_links.tiktok}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                      </svg>
                      @{channel.social_links.tiktok}
                    </a>
                  )}
                  {channel.social_links.discord && (
                    <a
                      href={channel.social_links.discord}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                      </svg>
                      Discord
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 space-y-3">
              {channel.website && (
                <div className="flex items-center gap-2 text-sm">
                  <svg
                    className="w-4 h-4 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                  <a
                    href={channel.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline cursor-pointer"
                  >
                    {channel.website}
                  </a>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg
                  className="w-4 h-4 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>
                  {t("joined", {
                    date: new Date(channel.created_at).toLocaleDateString(
                      undefined,
                      {
                        year: "numeric",
                        month: "long",
                      }
                    ),
                  })}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg
                  className="w-4 h-4 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                <span>{t("totalViews", { count: totalViews.toLocaleString() })}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
