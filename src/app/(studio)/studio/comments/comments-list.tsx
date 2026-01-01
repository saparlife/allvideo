"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquare, ThumbsUp, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  likes_count: number;
  video_id: string;
  user: {
    id: string;
    username: string;
    avatar_url: string | null;
  } | null;
}

interface Video {
  id: string;
  title: string;
  slug: string | null;
}

interface CommentsListClientProps {
  initialComments: Comment[];
  videos: Video[];
}

function timeAgo(date: string): string {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  const intervals = [
    { label: "y", seconds: 31536000 },
    { label: "mo", seconds: 2592000 },
    { label: "w", seconds: 604800 },
    { label: "d", seconds: 86400 },
    { label: "h", seconds: 3600 },
    { label: "m", seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count >= 1) {
      return `${count}${interval.label} ago`;
    }
  }

  return "just now";
}

export function CommentsListClient({
  initialComments,
  videos,
}: CommentsListClientProps) {
  const [comments, setComments] = useState(initialComments);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const videoMap = Object.fromEntries(videos.map((v) => [v.id, v]));

  const handleReply = async (commentId: string, videoId: string) => {
    if (!replyContent.trim() || submitting) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/videos/${videoId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: replyContent,
          parent_id: commentId,
        }),
      });

      if (response.ok) {
        toast.success("Reply posted");
        setReplyContent("");
        setReplyingTo(null);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to post reply");
      }
    } catch {
      toast.error("Failed to post reply");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    setDeleting(commentId);
    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setComments(comments.filter((c) => c.id !== commentId));
        toast.success("Comment deleted");
      } else {
        toast.error("Failed to delete comment");
      }
    } catch {
      toast.error("Failed to delete comment");
    } finally {
      setDeleting(null);
    }
  };

  if (comments.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <MessageSquare className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          No comments yet
        </h2>
        <p className="text-gray-600">
          Your videos haven't received any comments yet
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border divide-y">
      {comments.map((comment) => {
        const video = videoMap[comment.video_id];
        const isReplying = replyingTo === comment.id;

        return (
          <div key={comment.id} className="p-4 hover:bg-gray-50">
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shrink-0">
                {comment.user?.avatar_url ? (
                  <img
                    src={comment.user.avatar_url}
                    alt={comment.user.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white text-sm font-medium">
                    {comment.user?.username?.[0]?.toUpperCase() || "U"}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900">
                    @{comment.user?.username || "Unknown"}
                  </span>
                  <span className="text-sm text-gray-500">
                    {timeAgo(comment.created_at)}
                  </span>
                  {comment.likes_count > 0 && (
                    <span className="flex items-center gap-1 text-sm text-gray-500">
                      <ThumbsUp className="w-3 h-3" />
                      {comment.likes_count}
                    </span>
                  )}
                </div>
                <p className="text-gray-700 mt-1">{comment.content}</p>

                {/* Video link */}
                {video && (
                  <Link
                    href={`/watch/${video.slug || video.id}`}
                    className="inline-flex items-center gap-1 mt-2 text-sm text-indigo-600 hover:text-indigo-700 cursor-pointer"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      />
                    </svg>
                    {video.title}
                  </Link>
                )}

                {/* Reply form */}
                {isReplying && (
                  <div className="mt-3">
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Write a reply..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
                      rows={2}
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyContent("");
                        }}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() =>
                          handleReply(comment.id, comment.video_id)
                        }
                        disabled={submitting || !replyContent.trim()}
                        className="px-3 py-1.5 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 flex items-center gap-1"
                      >
                        {submitting && (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        )}
                        Reply
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    setReplyingTo(isReplying ? null : comment.id)
                  }
                  className={`p-2 rounded-lg cursor-pointer transition-colors ${
                    isReplying
                      ? "text-indigo-600 bg-indigo-50"
                      : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  }`}
                  title="Reply"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(comment.id)}
                  disabled={deleting === comment.id}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 cursor-pointer disabled:opacity-50"
                  title="Delete"
                >
                  {deleting === comment.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
