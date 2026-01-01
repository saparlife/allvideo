import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { VideoCard } from "@/components/public/video-card";
import type { Metadata } from "next";

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || "https://cdn.lovsell.com";

export const metadata: Metadata = {
  title: "Liked Videos",
  description: "Videos you've liked",
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

async function LikedVideos({ userId }: { userId: string }) {
  const supabase = await createClient();
  const t = await getTranslations();

  // Get liked videos
  const { data: likes } = await (supabase as any)
    .from("likes")
    .select(`
      id,
      created_at,
      video:video_id (
        id,
        title,
        slug,
        thumbnail_key,
        duration,
        views_count,
        created_at,
        users:user_id (
          id,
          username,
          avatar_url
        )
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  const likedList = (likes || []).filter((l: any) => l.video);

  if (likedList.length === 0) {
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
              d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          No liked videos
        </h2>
        <p className="text-gray-600">
          Videos you like will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {likedList.map((item: any) => (
        <VideoCard
          key={item.id}
          video={{
            id: item.video.id,
            slug: item.video.slug || item.video.id,
            title: item.video.title,
            thumbnail_url: item.video.thumbnail_key
              ? `${CDN_URL}/${item.video.thumbnail_key}`
              : null,
            duration: item.video.duration,
            views_count: item.video.views_count || 0,
            created_at: item.video.created_at,
            channel: item.video.users
              ? {
                  username: item.video.users.username || item.video.users.id,
                  avatar_url: item.video.users.avatar_url,
                }
              : undefined,
          }}
        />
      ))}
    </div>
  );
}

export default async function LikedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/liked");
  }

  const t = await getTranslations("nav");

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
          <svg
            className="w-5 h-5 text-indigo-600"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{t("likedVideos")}</h1>
      </div>

      <Suspense fallback={<VideoGridSkeleton />}>
        <LikedVideos userId={user.id} />
      </Suspense>
    </div>
  );
}
