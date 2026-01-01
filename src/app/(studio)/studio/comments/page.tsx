import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { CommentsListClient } from "./comments-list";
import { MessageSquare } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Comments - Creator Studio",
};

async function CommentsList({ userId }: { userId: string }) {
  const supabase = await createClient();

  // Get user's video IDs
  const { data: videos } = await (supabase as any)
    .from("videos")
    .select("id, title, slug")
    .eq("user_id", userId);

  const videoIds = (videos || []).map((v: any) => v.id);

  if (videoIds.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <MessageSquare className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No comments yet</h2>
        <p className="text-gray-600">Upload videos to start receiving comments</p>
      </div>
    );
  }

  // Get comments on user's videos
  const { data: comments } = await (supabase as any)
    .from("comments")
    .select(`
      id,
      content,
      created_at,
      likes_count,
      video_id,
      user:user_id (
        id,
        username,
        avatar_url
      )
    `)
    .in("video_id", videoIds)
    .is("parent_id", null)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <CommentsListClient
      initialComments={comments || []}
      videos={videos || []}
    />
  );
}

export default async function StudioCommentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const t = await getTranslations("studio");

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t("comments")}</h1>

      <Suspense
        fallback={
          <div className="bg-white rounded-xl border divide-y">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        }
      >
        <CommentsList userId={user.id} />
      </Suspense>
    </div>
  );
}
