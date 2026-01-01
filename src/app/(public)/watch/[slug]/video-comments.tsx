"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { MoreVertical, Edit2, Trash2, Loader2, Flag } from "lucide-react";
import { toast } from "sonner";
import { ReportDialog } from "@/components/report-dialog";
import { MentionText } from "@/components/mention-text";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  updated_at?: string;
  likes_count: number;
  is_liked?: boolean;
  user: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  replies?: Comment[];
}

interface VideoCommentsProps {
  videoId: string;
  commentsCount: number;
  currentUserId?: string;
  videoOwnerId?: string;
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
      return `${count}${interval.label}`;
    }
  }

  return "now";
}

function CommentItem({
  comment,
  currentUserId,
  videoOwnerId,
  onReply,
  onEdit,
  onDelete,
  onLike,
  replyingTo,
  replyContent,
  onReplyContentChange,
  onSubmitReply,
  onCancelReply,
  replySubmitting,
}: {
  comment: Comment;
  currentUserId?: string;
  videoOwnerId?: string;
  onReply: (parentId: string) => void;
  onEdit: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
  onLike: (commentId: string, liked: boolean, newCount: number) => void;
  replyingTo: { id: string; username: string } | null;
  replyContent: string;
  onReplyContentChange: (content: string) => void;
  onSubmitReply: (e: React.FormEvent) => void;
  onCancelReply: () => void;
  replySubmitting: boolean;
}) {
  const t = useTranslations("comments");
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [localLiked, setLocalLiked] = useState(comment.is_liked || false);
  const [localLikesCount, setLocalLikesCount] = useState(comment.likes_count || 0);
  const [showReportDialog, setShowReportDialog] = useState(false);

  const handleLike = async () => {
    if (!currentUserId || isLiking) return;

    setIsLiking(true);
    const wasLiked = localLiked;
    const prevCount = localLikesCount;

    // Optimistic update
    setLocalLiked(!wasLiked);
    setLocalLikesCount(wasLiked ? prevCount - 1 : prevCount + 1);

    try {
      const response = await fetch(`/api/comments/${comment.id}/like`, {
        method: wasLiked ? "DELETE" : "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setLocalLikesCount(data.likes_count);
        onLike(comment.id, data.liked, data.likes_count);
      } else {
        // Revert on error
        setLocalLiked(wasLiked);
        setLocalLikesCount(prevCount);
      }
    } catch {
      // Revert on error
      setLocalLiked(wasLiked);
      setLocalLikesCount(prevCount);
    } finally {
      setIsLiking(false);
    }
  };

  const isOwner = currentUserId === comment.user.id;
  const canDelete = isOwner || currentUserId === videoOwnerId;
  const canEdit = isOwner;

  const handleEdit = async () => {
    if (!editContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });

      if (response.ok) {
        onEdit(comment.id, editContent);
        setIsEditing(false);
        toast.success("Comment updated");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update comment");
      }
    } catch {
      toast.error("Failed to update comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onDelete(comment.id);
        toast.success("Comment deleted");
      } else {
        toast.error("Failed to delete comment");
      }
    } catch {
      toast.error("Failed to delete comment");
    }
  };

  return (
    <div className="flex gap-3 group">
      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shrink-0">
        {comment.user.avatar_url ? (
          <Image
            src={comment.user.avatar_url}
            alt={comment.user.username}
            width={40}
            height={40}
            className="rounded-full object-cover"
          />
        ) : (
          <span className="text-white text-sm font-medium">
            {comment.user.username[0]?.toUpperCase()}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 text-sm">
            @{comment.user.username}
          </span>
          <span className="text-xs text-gray-500">
            {timeAgo(comment.created_at)}
          </span>
          {comment.updated_at && comment.updated_at !== comment.created_at && (
            <span className="text-xs text-gray-400">(edited)</span>
          )}
        </div>

        {isEditing ? (
          <div className="mt-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
              rows={3}
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                }}
                className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-full"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                disabled={isSubmitting || !editContent.trim()}
                className="px-3 py-1.5 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-full disabled:opacity-50 flex items-center gap-1"
              >
                {isSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
                Save
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-700 mt-1 text-sm">
            <MentionText text={comment.content} />
          </p>
        )}

        <div className="flex items-center gap-4 mt-2">
          <button
            onClick={handleLike}
            disabled={!currentUserId || isLiking}
            className={`flex items-center gap-1 text-sm cursor-pointer transition-colors ${
              localLiked
                ? "text-indigo-600"
                : "text-gray-500 hover:text-gray-700"
            } ${!currentUserId ? "cursor-default" : ""}`}
          >
            <svg
              className="w-4 h-4"
              fill={localLiked ? "currentColor" : "none"}
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
              />
            </svg>
            {localLikesCount > 0 && <span>{localLikesCount}</span>}
          </button>
          {currentUserId && (
            <button
              onClick={() => onReply(comment.id)}
              className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              {t("reply")}
            </button>
          )}

          {/* Menu for edit/delete/report */}
          {(canEdit || canDelete || (currentUserId && !isOwner)) && (
            <div className="relative ml-auto">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
                    {canEdit && (
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => {
                          handleDelete();
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    )}
                    {currentUserId && !isOwner && (
                      <button
                        onClick={() => {
                          setShowReportDialog(true);
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Flag className="w-4 h-4" />
                        Report
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Report Dialog */}
          <ReportDialog
            isOpen={showReportDialog}
            onClose={() => setShowReportDialog(false)}
            type="comment"
            targetId={comment.id}
          />
        </div>

        {/* Reply Form */}
        {replyingTo?.id === comment.id && (
          <form onSubmit={onSubmitReply} className="mt-3 pl-0">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full shrink-0" />
              <div className="flex-1">
                <div className="text-xs text-gray-500 mb-1">
                  Replying to @{replyingTo.username}
                </div>
                <input
                  type="text"
                  value={replyContent}
                  onChange={(e) => onReplyContentChange(e.target.value)}
                  placeholder="Add a reply..."
                  className="w-full px-0 py-2 border-0 border-b border-gray-200 focus:border-indigo-500 focus:ring-0 outline-none text-sm"
                  autoFocus
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={onCancelReply}
                    className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-full cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={replySubmitting || !replyContent.trim()}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-full disabled:opacity-50 cursor-pointer flex items-center gap-1"
                  >
                    {replySubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
                    Reply
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-4 pl-4 border-l-2 border-gray-100">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                currentUserId={currentUserId}
                videoOwnerId={videoOwnerId}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
                onLike={onLike}
                replyingTo={replyingTo}
                replyContent={replyContent}
                onReplyContentChange={onReplyContentChange}
                onSubmitReply={onSubmitReply}
                onCancelReply={onCancelReply}
                replySubmitting={replySubmitting}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function VideoComments({
  videoId,
  commentsCount,
  currentUserId,
  videoOwnerId,
}: VideoCommentsProps) {
  const t = useTranslations("comments");
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "top">("newest");
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [videoId, sortBy]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/videos/${videoId}/comments?sort=${sortBy}`
      );
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/videos/${videoId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments((prev) => [data.comment, ...prev]);
        setNewComment("");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = (parentId: string) => {
    // Find the comment to get the username for display
    const findComment = (comments: Comment[]): Comment | undefined => {
      for (const comment of comments) {
        if (comment.id === parentId) return comment;
        if (comment.replies) {
          const found = findComment(comment.replies);
          if (found) return found;
        }
      }
      return undefined;
    };
    const comment = findComment(comments);
    if (comment) {
      setReplyingTo({ id: parentId, username: comment.user.username });
      setReplyContent("");
    }
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyContent("");
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || replySubmitting || !replyingTo) return;

    setReplySubmitting(true);
    try {
      const response = await fetch(`/api/videos/${videoId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent, parent_id: replyingTo.id }),
      });

      if (response.ok) {
        const data = await response.json();
        // Add the reply to the parent comment's replies array
        const addReply = (comments: Comment[]): Comment[] => {
          return comments.map((comment) => {
            if (comment.id === replyingTo.id) {
              return {
                ...comment,
                replies: [...(comment.replies || []), data.comment],
              };
            }
            if (comment.replies) {
              return { ...comment, replies: addReply(comment.replies) };
            }
            return comment;
          });
        };
        setComments(addReply);
        setReplyingTo(null);
        setReplyContent("");
        toast.success("Reply posted");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to post reply");
      }
    } catch {
      toast.error("Failed to post reply");
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleEditComment = (commentId: string, newContent: string) => {
    const updateComment = (comments: Comment[]): Comment[] => {
      return comments.map((comment) => {
        if (comment.id === commentId) {
          return { ...comment, content: newContent, updated_at: new Date().toISOString() };
        }
        if (comment.replies) {
          return { ...comment, replies: updateComment(comment.replies) };
        }
        return comment;
      });
    };
    setComments(updateComment);
  };

  const handleDeleteComment = (commentId: string) => {
    const removeComment = (comments: Comment[]): Comment[] => {
      return comments
        .filter((comment) => comment.id !== commentId)
        .map((comment) => {
          if (comment.replies) {
            return { ...comment, replies: removeComment(comment.replies) };
          }
          return comment;
        });
    };
    setComments(removeComment);
  };

  const handleLikeComment = (commentId: string, liked: boolean, newCount: number) => {
    const updateLike = (comments: Comment[]): Comment[] => {
      return comments.map((comment) => {
        if (comment.id === commentId) {
          return { ...comment, is_liked: liked, likes_count: newCount };
        }
        if (comment.replies) {
          return { ...comment, replies: updateLike(comment.replies) };
        }
        return comment;
      });
    };
    setComments(updateLike);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">
          {commentsCount} {t("title")}
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{t("sortBy")}:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "newest" | "top")}
            className="text-sm border-none bg-transparent text-gray-700 font-medium focus:ring-0 cursor-pointer"
          >
            <option value="newest">{t("newest")}</option>
            <option value="top">{t("top")}</option>
          </select>
        </div>
      </div>

      {/* Comment form */}
      {currentUserId ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full shrink-0" />
            <div className="flex-1">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={t("addComment")}
                className="w-full px-0 py-2 border-0 border-b border-gray-200 focus:border-indigo-500 focus:ring-0 outline-none text-sm"
              />
              {newComment && (
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setNewComment("")}
                    className="px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-full cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-full disabled:opacity-50 cursor-pointer"
                  >
                    Comment
                  </button>
                </div>
              )}
            </div>
          </div>
        </form>
      ) : (
        <p className="mb-6 text-sm text-gray-500">{t("signInToComment")}</p>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
              <div className="flex-1">
                <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-full bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">{t("noComments")}</p>
          <p className="text-sm text-gray-500 mt-1">{t("beFirst")}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              videoOwnerId={videoOwnerId}
              onReply={handleReply}
              onEdit={handleEditComment}
              onDelete={handleDeleteComment}
              onLike={handleLikeComment}
              replyingTo={replyingTo}
              replyContent={replyContent}
              onReplyContentChange={setReplyContent}
              onSubmitReply={handleSubmitReply}
              onCancelReply={handleCancelReply}
              replySubmitting={replySubmitting}
            />
          ))}
        </div>
      )}
    </div>
  );
}
