"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface ChannelHeaderProps {
  channel: {
    id: string;
    username: string;
    avatar_url?: string | null;
    banner_url?: string | null;
    bio?: string | null;
    website?: string | null;
    subscribers_count: number;
    total_views: number;
    joined_at: string;
  };
  isSubscribed: boolean;
  isOwner: boolean;
  currentUserId?: string;
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

export function ChannelHeader({
  channel,
  isSubscribed: initialIsSubscribed,
  isOwner,
  currentUserId,
}: ChannelHeaderProps) {
  const t = useTranslations();
  const [isSubscribed, setIsSubscribed] = useState(initialIsSubscribed);
  const [subscribersCount, setSubscribersCount] = useState(
    channel.subscribers_count
  );
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleSubscribe = async () => {
    if (!currentUserId || isSubscribing) return;

    setIsSubscribing(true);
    try {
      const response = await fetch(
        `/api/channels/${channel.username}/subscribe`,
        {
          method: isSubscribed ? "DELETE" : "POST",
        }
      );

      if (response.ok) {
        setIsSubscribed(!isSubscribed);
        setSubscribersCount((prev) => (isSubscribed ? prev - 1 : prev + 1));
      }
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <div>
      {/* Banner */}
      <div className="h-32 sm:h-48 bg-gradient-to-r from-indigo-500 to-purple-600">
        {channel.banner_url && (
          <Image
            src={channel.banner_url}
            alt="Channel banner"
            fill
            className="object-cover"
          />
        )}
      </div>

      {/* Channel info */}
      <div className="px-4 py-4 flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-10 sm:-mt-6">
        {/* Avatar */}
        <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full border-4 border-white flex items-center justify-center shrink-0">
          {channel.avatar_url ? (
            <Image
              src={channel.avatar_url}
              alt={channel.username}
              width={128}
              height={128}
              className="rounded-full object-cover"
            />
          ) : (
            <span className="text-white text-4xl font-bold">
              {channel.username[0]?.toUpperCase()}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 pb-2">
          <h1 className="text-2xl font-bold text-gray-900">
            {channel.username}
          </h1>
          <p className="text-gray-600">@{channel.username}</p>
          <p className="text-sm text-gray-500 mt-1">
            {formatNumber(subscribersCount)} {t("channel.subscribers", { count: subscribersCount })}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {isOwner ? (
            <Link
              href="/studio/customization"
              className="px-5 py-2 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Customize channel
            </Link>
          ) : (
            <button
              onClick={handleSubscribe}
              disabled={!currentUserId || isSubscribing}
              className={`px-5 py-2 rounded-full font-medium transition-colors cursor-pointer ${
                isSubscribed
                  ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              } ${!currentUserId ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isSubscribed
                ? t("video.subscribed")
                : t("video.subscribe")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
