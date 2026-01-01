import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { VideoCard } from "@/components/public/video-card";
import Link from "next/link";
import type { Metadata } from "next";

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || "https://cdn.lovsell.com";

export const metadata: Metadata = {
  title: "Subscriptions",
  description: "Watch videos from channels you're subscribed to",
};

function VideoGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-video bg-gray-200 rounded-xl" />
          <div className="flex gap-3 mt-3">
            <div className="w-9 h-9 bg-gray-200 rounded-full shrink-0" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

async function SubscriptionsFeed({ userId }: { userId: string }) {
  const supabase = await createClient();
  const t = await getTranslations();

  // Get subscribed channel IDs
  const { data: subscriptions } = await (supabase as any)
    .from("channel_subscriptions")
    .select("channel_id")
    .eq("subscriber_id", userId);

  const channelIds = (subscriptions || []).map((s: any) => s.channel_id);

  if (channelIds.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg
            className="w-10 h-10 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          No subscriptions yet
        </h2>
        <p className="text-gray-600 mb-4">
          Subscribe to channels to see their videos here
        </p>
        <Link
          href="/trending"
          className="inline-flex px-4 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors cursor-pointer"
        >
          Explore trending
        </Link>
      </div>
    );
  }

  // Get videos from subscribed channels
  const { data: videos } = await (supabase as any)
    .from("videos")
    .select(`
      id,
      title,
      slug,
      thumbnail_key,
      duration,
      views_count,
      created_at,
      user_id,
      users:user_id (
        id,
        username,
        avatar_url
      )
    `)
    .eq("status", "ready")
    .eq("visibility", "public")
    .in("user_id", channelIds)
    .order("created_at", { ascending: false })
    .limit(48);

  const videoList = videos || [];

  if (videoList.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg
            className="w-10 h-10 text-gray-400"
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
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          No new videos
        </h2>
        <p className="text-gray-600">
          Your subscribed channels haven't uploaded recently
        </p>
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
            thumbnail_url: video.thumbnail_key
              ? `${CDN_URL}/${video.thumbnail_key}`
              : null,
            duration: video.duration,
            views_count: video.views_count || 0,
            created_at: video.created_at,
            channel: video.users
              ? {
                  username: video.users.username || video.users.id,
                  avatar_url: video.users.avatar_url,
                }
              : undefined,
          }}
        />
      ))}
    </div>
  );
}

export default async function SubscriptionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/subscriptions");
  }

  const t = await getTranslations("nav");

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {t("subscriptions")}
      </h1>

      <Suspense fallback={<VideoGridSkeleton />}>
        <SubscriptionsFeed userId={user.id} />
      </Suspense>
    </div>
  );
}
