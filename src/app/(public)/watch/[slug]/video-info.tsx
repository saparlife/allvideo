"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Flag } from "lucide-react";
import { AddToPlaylist } from "@/components/playlists/add-to-playlist";
import { ReportDialog } from "@/components/report-dialog";

interface VideoInfoProps {
  video: {
    id: string;
    title: string;
    description?: string | null;
    views_count: number;
    likes_count: number;
    created_at: string;
    tags?: string[] | null;
    channel: {
      id: string;
      username: string;
      avatar_url?: string | null;
      subscribers_count: number;
    } | null;
  };
  isLiked: boolean;
  isSubscribed: boolean;
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

function formatDate(date: string): string {
  const d = new Date(date);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function VideoInfo({
  video,
  isLiked: initialIsLiked,
  isSubscribed: initialIsSubscribed,
  currentUserId,
}: VideoInfoProps) {
  const t = useTranslations("video");
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likesCount, setLikesCount] = useState(video.likes_count);
  const [isSubscribed, setIsSubscribed] = useState(initialIsSubscribed);
  const [subscribersCount, setSubscribersCount] = useState(
    video.channel?.subscribers_count || 0
  );
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [likeAnimation, setLikeAnimation] = useState(false);

  const handleLike = async () => {
    if (!currentUserId || isLiking) return;

    setIsLiking(true);

    // Trigger animation only when liking (not unliking)
    if (!isLiked) {
      setLikeAnimation(true);
      setTimeout(() => setLikeAnimation(false), 300);
    }

    try {
      const response = await fetch(`/api/videos/${video.id}/like`, {
        method: isLiked ? "DELETE" : "POST",
      });

      if (response.ok) {
        setIsLiked(!isLiked);
        setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
      }
    } finally {
      setIsLiking(false);
    }
  };

  const handleSubscribe = async () => {
    if (!currentUserId || !video.channel || isSubscribing) return;

    setIsSubscribing(true);
    try {
      const response = await fetch(
        `/api/channels/${video.channel.username}/subscribe`,
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

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: video.title,
          url,
        });
      } catch {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(url);
      // Could show a toast here
    }
  };

  const isOwner = currentUserId === video.channel?.id;

  return (
    <div className="mt-4">
      {/* Title */}
      <h1 className="text-xl font-bold text-gray-900">{video.title}</h1>

      {/* Stats and actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-3">
        {/* Views and date */}
        <p className="text-sm text-gray-600">
          {formatNumber(video.views_count)} views • {formatDate(video.created_at)}
        </p>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Like button */}
          <button
            onClick={handleLike}
            disabled={!currentUserId || isLiking}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all cursor-pointer ${
              isLiked
                ? "bg-indigo-100 text-indigo-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            } ${!currentUserId ? "opacity-50 cursor-not-allowed" : ""} ${
              likeAnimation ? "scale-110" : ""
            }`}
            style={{ transition: "transform 0.15s ease-out, background-color 0.2s, color 0.2s" }}
          >
            <svg
              className={`w-5 h-5 transition-transform ${likeAnimation ? "scale-125" : ""}`}
              fill={isLiked ? "currentColor" : "none"}
              viewBox="0 0 24 24"
              stroke="currentColor"
              style={{ transition: "transform 0.15s ease-out" }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
              />
            </svg>
            <span className="font-medium">{formatNumber(likesCount)}</span>
          </button>

          {/* Share button */}
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            <span className="font-medium">{t("share")}</span>
          </button>

          {/* Save to playlist */}
          {currentUserId && <AddToPlaylist videoId={video.id} />}

          {/* Report button */}
          {currentUserId && !isOwner && (
            <button
              onClick={() => setShowReportDialog(true)}
              className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 hover:text-red-600 transition-colors cursor-pointer"
              title="Report video"
            >
              <Flag className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Report Dialog */}
      <ReportDialog
        isOpen={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        type="video"
        targetId={video.id}
      />

      {/* Channel info */}
      {video.channel && (
        <div className="flex items-center justify-between gap-4 mt-4 p-4 bg-gray-50 rounded-xl">
          <Link
            href={`/channel/${video.channel.username}`}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shrink-0">
              {video.channel.avatar_url ? (
                <Image
                  src={video.channel.avatar_url}
                  alt={video.channel.username}
                  width={48}
                  height={48}
                  className="rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-medium">
                  {video.channel.username[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {video.channel.username}
              </p>
              <p className="text-sm text-gray-600">
                {formatNumber(subscribersCount)} subscribers
              </p>
            </div>
          </Link>

          {!isOwner && (
            <button
              onClick={handleSubscribe}
              disabled={!currentUserId || isSubscribing}
              className={`px-5 py-2 rounded-full font-medium transition-colors cursor-pointer ${
                isSubscribed
                  ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              } ${!currentUserId ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isSubscribed ? t("subscribed") : t("subscribe")}
            </button>
          )}
        </div>
      )}

      {/* Description */}
      {video.description && (
        <div className="mt-4 p-4 bg-gray-50 rounded-xl">
          <p
            className={`text-gray-700 whitespace-pre-wrap ${
              !showFullDescription ? "line-clamp-3" : ""
            }`}
          >
            {video.description}
          </p>
          {video.description.length > 200 && (
            <button
              onClick={() => setShowFullDescription(!showFullDescription)}
              className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 cursor-pointer"
            >
              {showFullDescription ? t("showLess") : t("showMore")}
            </button>
          )}
        </div>
      )}

      {/* Tags */}
      {video.tags && video.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {video.tags.map((tag) => (
            <Link
              key={tag}
              href={`/search?q=${encodeURIComponent(tag)}`}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
