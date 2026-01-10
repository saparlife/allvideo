import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || "https://cdn.1app.to";

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

async function DashboardStats({ userId }: { userId: string }) {
  const supabase = await createClient();

  // Get videos stats
  const { data: videos } = await (supabase as any)
    .from("videos")
    .select("id, views_count, likes_count, comments_count")
    .eq("user_id", userId);

  const videoList = videos || [];
  const totalViews = videoList.reduce((sum: number, v: any) => sum + (v.views_count || 0), 0);
  const totalLikes = videoList.reduce((sum: number, v: any) => sum + (v.likes_count || 0), 0);
  const totalComments = videoList.reduce((sum: number, v: any) => sum + (v.comments_count || 0), 0);

  // Get subscribers count
  const { count: subscribers } = await (supabase as any)
    .from("channel_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("channel_id", userId);

  const stats = [
    {
      label: "Total views",
      value: formatNumber(totalViews),
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Subscribers",
      value: formatNumber(subscribers || 0),
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: "text-purple-600 bg-purple-50",
    },
    {
      label: "Total likes",
      value: formatNumber(totalLikes),
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
        </svg>
      ),
      color: "text-pink-600 bg-pink-50",
    },
    {
      label: "Comments",
      value: formatNumber(totalComments),
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      color: "text-green-600 bg-green-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-white rounded-xl p-6 border">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

async function RecentVideos({ userId }: { userId: string }) {
  const supabase = await createClient();

  const { data: videos } = await (supabase as any)
    .from("videos")
    .select("id, title, thumbnail_key, views_count, status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  const videoList = videos || [];

  if (videoList.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No videos yet</p>
        <Link
          href="/studio/upload"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
        >
          Upload your first video
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {videoList.map((video: any) => (
        <Link
          key={video.id}
          href={`/studio/videos/${video.id}`}
          className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
        >
          <div className="w-24 aspect-video bg-gray-200 rounded-lg overflow-hidden shrink-0">
            {video.thumbnail_key && (
              <img
                src={`${CDN_URL}/${video.thumbnail_key}`}
                alt={video.title}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">{video.title}</p>
            <p className="text-sm text-gray-500">
              {formatNumber(video.views_count || 0)} views
            </p>
          </div>
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              video.status === "ready"
                ? "bg-green-100 text-green-700"
                : video.status === "processing"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {video.status}
          </span>
        </Link>
      ))}
    </div>
  );
}

async function RecentComments({ userId }: { userId: string }) {
  const supabase = await createClient();

  // Get comments on user's videos
  const { data: comments } = await (supabase as any)
    .from("comments")
    .select(`
      id,
      content,
      created_at,
      user:user_id (
        username,
        avatar_url
      ),
      video:video_id (
        id,
        title,
        user_id
      )
    `)
    .order("created_at", { ascending: false })
    .limit(10);

  // Filter to only show comments on user's videos
  const userComments = (comments || []).filter(
    (c: any) => c.video?.user_id === userId
  );

  if (userComments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No comments yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {userComments.slice(0, 5).map((comment: any) => (
        <div key={comment.id} className="flex gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-medium">
              {comment.user?.username?.[0]?.toUpperCase() || "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm">
              <span className="font-medium text-gray-900">
                @{comment.user?.username || "Unknown"}
              </span>{" "}
              <span className="text-gray-600">
                commented on "{comment.video?.title}"
              </span>
            </p>
            <p className="text-sm text-gray-700 mt-1 line-clamp-2">
              {comment.content}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function StudioDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const t = await getTranslations("studio");

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t("dashboard")}</h1>

      {/* Stats */}
      <Suspense
        fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                  <div>
                    <div className="h-6 w-16 bg-gray-200 rounded mb-1" />
                    <div className="h-4 w-20 bg-gray-200 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        }
      >
        <DashboardStats userId={user.id} />
      </Suspense>

      {/* Content sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Recent videos */}
        <div className="bg-white rounded-xl border">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold text-gray-900">{t("topVideos")}</h2>
            <Link
              href="/studio/videos"
              className="text-sm text-indigo-600 hover:text-indigo-700 cursor-pointer"
            >
              View all
            </Link>
          </div>
          <Suspense
            fallback={
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 animate-pulse">
                    <div className="w-24 aspect-video bg-gray-200 rounded-lg" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            }
          >
            <div className="p-4">
              <RecentVideos userId={user.id} />
            </div>
          </Suspense>
        </div>

        {/* Recent comments */}
        <div className="bg-white rounded-xl border">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold text-gray-900">{t("recentComments")}</h2>
            <Link
              href="/studio/comments"
              className="text-sm text-indigo-600 hover:text-indigo-700 cursor-pointer"
            >
              View all
            </Link>
          </div>
          <Suspense
            fallback={
              <div className="p-4 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-8 h-8 bg-gray-200 rounded-full" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            }
          >
            <div className="p-4">
              <RecentComments userId={user.id} />
            </div>
          </Suspense>
        </div>
      </div>
    </div>
  );
}
