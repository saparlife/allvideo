import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { AnalyticsCharts } from "./analytics-charts";
import { TimeRangeSelector } from "./time-range-selector";
import type { Metadata } from "next";

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || "https://cdn.lovsell.com";

export const metadata: Metadata = {
  title: "Analytics - Creator Studio",
};

interface Props {
  searchParams: Promise<{ range?: string }>;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function getRangeDays(range: string): number {
  switch (range) {
    case "28d": return 28;
    case "90d": return 90;
    case "365d": return 365;
    default: return 7;
  }
}

async function AnalyticsDashboard({ userId, range = "7d" }: { userId: string; range?: string }) {
  const supabase = await createClient();

  // Get all videos with stats
  const { data: videos } = await (supabase as any)
    .from("videos")
    .select("id, title, thumbnail_key, views_count, likes_count, comments_count, created_at")
    .eq("user_id", userId)
    .eq("status", "ready")
    .order("views_count", { ascending: false });

  const videoList = videos || [];

  // Calculate totals
  const totalViews = videoList.reduce((sum: number, v: any) => sum + (v.views_count || 0), 0);
  const totalLikes = videoList.reduce((sum: number, v: any) => sum + (v.likes_count || 0), 0);
  const totalComments = videoList.reduce((sum: number, v: any) => sum + (v.comments_count || 0), 0);

  // Get subscribers count
  const { count: subscribers } = await (supabase as any)
    .from("channel_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("channel_id", userId);

  // Get range days and label
  const rangeDays = getRangeDays(range);
  const rangeStart = new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000);
  const rangeLabel = range === "28d" ? "Last 28 days"
    : range === "90d" ? "Last 90 days"
    : range === "365d" ? "Last 365 days"
    : "Last 7 days";

  // Get recent subscribers in range
  const { count: recentSubs } = await (supabase as any)
    .from("channel_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("channel_id", userId)
    .gte("created_at", rangeStart.toISOString());

  // Calculate chart data points (limit to 14 points for readability)
  const chartPoints = Math.min(rangeDays, 14);
  const daysBetweenPoints = Math.floor(rangeDays / chartPoints);

  // Get video views data for chart
  const viewsData = Array.from({ length: chartPoints }, (_, i) => {
    const endDate = new Date(Date.now() - (chartPoints - 1 - i) * daysBetweenPoints * 24 * 60 * 60 * 1000);
    const startDate = new Date(endDate.getTime() - daysBetweenPoints * 24 * 60 * 60 * 1000);

    const periodVideos = videoList.filter((v: any) => {
      const videoDate = new Date(v.created_at);
      return videoDate >= startDate && videoDate <= endDate;
    });
    const periodViews = periodVideos.reduce((sum: number, v: any) => sum + (v.views_count || 0), 0);

    let label: string;
    if (rangeDays <= 14) {
      label = endDate.toLocaleDateString("en", { weekday: "short" });
    } else if (rangeDays <= 90) {
      label = endDate.toLocaleDateString("en", { month: "short", day: "numeric" });
    } else {
      label = endDate.toLocaleDateString("en", { month: "short" });
    }

    return { label, value: periodViews };
  });

  // Get subscriber growth data
  const subsData = Array.from({ length: chartPoints }, (_, i) => {
    const endDate = new Date(Date.now() - (chartPoints - 1 - i) * daysBetweenPoints * 24 * 60 * 60 * 1000);

    let label: string;
    if (rangeDays <= 14) {
      label = endDate.toLocaleDateString("en", { weekday: "short" });
    } else if (rangeDays <= 90) {
      label = endDate.toLocaleDateString("en", { month: "short", day: "numeric" });
    } else {
      label = endDate.toLocaleDateString("en", { month: "short" });
    }

    // Simulated data proportional to range
    return {
      label,
      value: Math.floor(Math.random() * Math.max(1, (recentSubs || 5) / chartPoints)),
    };
  });

  // Video performance data
  const performanceData = videoList.slice(0, 5).map((v: any) => ({
    label: v.title.length > 15 ? v.title.substring(0, 12) + "..." : v.title,
    value: v.views_count || 0,
  }));

  return (
    <div className="space-y-8">
      {/* Overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-6">
          <p className="text-sm text-gray-600 mb-1">Total views</p>
          <p className="text-3xl font-bold text-gray-900">{formatNumber(totalViews)}</p>
        </div>
        <div className="bg-white rounded-xl border p-6">
          <p className="text-sm text-gray-600 mb-1">Subscribers</p>
          <p className="text-3xl font-bold text-gray-900">{formatNumber(subscribers || 0)}</p>
          {recentSubs && recentSubs > 0 && (
            <p className="text-sm text-green-600 mt-1">+{recentSubs} last {rangeDays} days</p>
          )}
        </div>
        <div className="bg-white rounded-xl border p-6">
          <p className="text-sm text-gray-600 mb-1">Total likes</p>
          <p className="text-3xl font-bold text-gray-900">{formatNumber(totalLikes)}</p>
        </div>
        <div className="bg-white rounded-xl border p-6">
          <p className="text-sm text-gray-600 mb-1">Total comments</p>
          <p className="text-3xl font-bold text-gray-900">{formatNumber(totalComments)}</p>
        </div>
      </div>

      {/* Charts */}
      <AnalyticsCharts
        viewsData={viewsData}
        subsData={subsData}
        performanceData={performanceData}
        rangeLabel={rangeLabel}
      />

      {/* Top videos */}
      <div className="bg-white rounded-xl border">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-gray-900">Top videos</h2>
        </div>
        {videoList.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            No videos to analyze yet
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Video</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Views</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Likes</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Comments</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Engagement</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {videoList.slice(0, 10).map((video: any) => {
                const engagement = video.views_count > 0
                  ? (((video.likes_count || 0) + (video.comments_count || 0)) / video.views_count * 100).toFixed(1)
                  : "0";

                return (
                  <tr key={video.id} className="hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-20 aspect-video bg-gray-200 rounded-lg overflow-hidden shrink-0">
                          {video.thumbnail_key && (
                            <img
                              src={`${CDN_URL}/${video.thumbnail_key}`}
                              alt={video.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <p className="font-medium text-gray-900 line-clamp-2">{video.title}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right text-sm text-gray-900">
                      {formatNumber(video.views_count || 0)}
                    </td>
                    <td className="py-4 px-4 text-right text-sm text-gray-900">
                      {formatNumber(video.likes_count || 0)}
                    </td>
                    <td className="py-4 px-4 text-right text-sm text-gray-900">
                      {formatNumber(video.comments_count || 0)}
                    </td>
                    <td className="py-4 px-4 text-right text-sm text-gray-900">
                      {engagement}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default async function StudioAnalyticsPage({ searchParams }: Props) {
  const { range = "7d" } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const t = await getTranslations("studio");

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("analytics")}</h1>
        <TimeRangeSelector currentRange={range} />
      </div>

      <Suspense
        fallback={
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
                  <div className="h-8 bg-gray-200 rounded w-16" />
                </div>
              ))}
            </div>
          </div>
        }
      >
        <AnalyticsDashboard userId={user.id} range={range} />
      </Suspense>
    </div>
  );
}
