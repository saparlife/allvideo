import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { VideoListClient } from "./video-list-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Content - Creator Studio",
};

async function VideoList({ userId }: { userId: string }) {
  const supabase = await createClient();

  const { data: videos } = await (supabase as any)
    .from("videos")
    .select(`
      id,
      title,
      description,
      thumbnail_key,
      thumbnail_url,
      duration,
      views_count,
      likes_count,
      comments_count,
      status,
      visibility,
      created_at
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return <VideoListClient videos={videos || []} />;
}

export default async function StudioVideosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const t = await getTranslations("studio");

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("content")}</h1>
        <Link
          href="/studio/upload"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Upload
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="bg-white rounded-xl border p-8">
            <div className="animate-pulse space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-32 aspect-video bg-gray-200 rounded-lg" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        }
      >
        <VideoList userId={user.id} />
      </Suspense>
    </div>
  );
}
