import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { VideoCard } from "@/components/public/video-card";

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || "https://cdn.lovsell.com";

interface RelatedVideosProps {
  currentVideoId: string;
  categoryId?: string | null;
  channelId: string;
}

export async function RelatedVideos({
  currentVideoId,
  categoryId,
  channelId,
}: RelatedVideosProps) {
  const supabase = await createClient();
  const t = await getTranslations("video");

  // Fetch related videos (same category or from same channel)
  const { data: videos } = await (supabase as any)
    .from("videos")
    .select(
      `
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
    `
    )
    .eq("status", "ready")
    .eq("visibility", "public")
    .neq("id", currentVideoId)
    .order("views_count", { ascending: false })
    .limit(12);

  const videoList = videos || [];

  if (videoList.length === 0) {
    return null;
  }

  // Group: first show from same channel, then others
  const channelVideos = videoList.filter(
    (v: any) => v.user_id === channelId
  );
  const otherVideos = videoList.filter((v: any) => v.user_id !== channelId);

  return (
    <div className="space-y-4">
      {channelVideos.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-3">
            More from this channel
          </h3>
          <div className="space-y-3">
            {channelVideos.slice(0, 4).map((video: any) => (
              <div key={video.id} className="flex gap-2">
                <div className="w-40 shrink-0">
                  <VideoCard
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
                    }}
                    size="small"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {otherVideos.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-3">
            {t("relatedVideos")}
          </h3>
          <div className="space-y-3">
            {otherVideos.map((video: any) => (
              <div key={video.id} className="flex gap-2">
                <div className="w-40 shrink-0">
                  <VideoCard
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
                    size="small"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
