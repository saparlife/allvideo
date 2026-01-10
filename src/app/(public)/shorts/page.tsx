import { createClient } from "@/lib/supabase/server";
import { ShortsFeed } from "./shorts-feed";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shorts",
  description: "Watch short videos on UnlimVideo",
};

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || "https://cdn.1app.to";

export default async function ShortsPage() {
  const supabase = await createClient();

  // Fetch initial shorts
  const { data: shorts } = await (supabase as any)
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
      likes_count,
      comments_count,
      created_at,
      user_id,
      users:user_id (
        id,
        username,
        avatar_url
      )
    `)
    .eq("status", "ready")
    .eq("is_short", true)
    .in("visibility", ["public", null])
    .order("created_at", { ascending: false })
    .limit(20);

  const shortsList = (shorts || []).map((s: any) => ({
    id: s.id,
    title: s.title,
    slug: s.slug || s.id,
    description: s.description,
    thumbnail_url: s.thumbnail_url || (s.thumbnail_key ? `${CDN_URL}/${s.thumbnail_key}` : null),
    hls_url: s.hls_key ? `${CDN_URL}/${s.hls_key}` : null,
    duration: s.duration,
    views_count: s.views_count || 0,
    likes_count: s.likes_count || 0,
    comments_count: s.comments_count || 0,
    created_at: s.created_at,
    channel: s.users ? {
      id: s.users.id,
      username: s.users.username,
      avatar_url: s.users.avatar_url,
    } : null,
  }));

  if (shortsList.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-20 h-20 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">No Shorts Yet</h2>
          <p className="text-gray-400">Be the first to upload a Short!</p>
        </div>
      </div>
    );
  }

  return <ShortsFeed initialShorts={shortsList} />;
}
