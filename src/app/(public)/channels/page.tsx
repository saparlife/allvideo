import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Users } from "lucide-react";

export const metadata = {
  title: "Popular Channels - UnlimVideo",
  description: "Discover popular video creators",
};

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

async function ChannelsContent() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get channels with most subscribers
  const { data: channels, error } = await (supabase as any)
    .from("users")
    .select(`
      id,
      username,
      bio,
      avatar_url,
      banner_url,
      subscribers_count,
      videos:videos(count)
    `)
    .not("username", "is", null)
    .order("subscribers_count", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error fetching channels:", error);
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load channels</p>
      </div>
    );
  }

  // Get user's subscriptions if logged in
  let subscribedIds = new Set<string>();
  if (user) {
    const { data: subs } = await (supabase as any)
      .from("channel_subscriptions")
      .select("channel_id")
      .eq("subscriber_id", user.id);

    if (subs) {
      subscribedIds = new Set(subs.map((s: any) => s.channel_id));
    }
  }

  if (!channels || channels.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No channels found</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Popular Channels</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {channels.map((channel: any) => {
          const isSubscribed = subscribedIds.has(channel.id);
          const videoCount = channel.videos?.[0]?.count || 0;

          return (
            <Link
              key={channel.id}
              href={`/channel/${channel.username}`}
              className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Banner */}
              <div className="h-24 bg-gradient-to-br from-indigo-500 to-purple-600 relative">
                {channel.banner_url && (
                  <img
                    src={channel.banner_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Channel info */}
              <div className="p-4 pt-0 relative">
                {/* Avatar */}
                <div className="w-16 h-16 rounded-full border-4 border-white bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center -mt-8 relative z-10">
                  {channel.avatar_url ? (
                    <img
                      src={channel.avatar_url}
                      alt={channel.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-bold text-white">
                      {channel.username?.[0]?.toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="mt-2">
                  <h2 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {channel.username}
                  </h2>
                  <p className="text-sm text-gray-500">@{channel.username}</p>

                  <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                    <span>{formatNumber(channel.subscribers_count || 0)} subscribers</span>
                    <span>•</span>
                    <span>{videoCount} video{videoCount !== 1 ? "s" : ""}</span>
                  </div>

                  {channel.bio && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {channel.bio}
                    </p>
                  )}

                  {isSubscribed && (
                    <span className="inline-block mt-3 text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                      Subscribed
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function ChannelsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="h-8 w-48 bg-gray-200 rounded mb-6 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="h-24 bg-gray-200 animate-pulse" />
                <div className="p-4 pt-0">
                  <div className="w-16 h-16 rounded-full bg-gray-200 -mt-8 animate-pulse" />
                  <div className="mt-2 space-y-2">
                    <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      }
    >
      <ChannelsContent />
    </Suspense>
  );
}
