"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Trash2, EyeOff, Lock, Globe, Loader2, CheckSquare, Square, Filter, ArrowUpDown, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || "https://cdn.1app.to";

interface Video {
  id: string;
  title: string;
  description: string | null;
  thumbnail_key: string | null;
  thumbnail_url: string | null;
  duration: number | null;
  views_count: number;
  likes_count: number;
  comments_count: number;
  status: string;
  visibility: string;
  created_at: string;
}

interface VideoListClientProps {
  videos: Video[];
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function formatDate(date: string): string {
  const d = new Date(date);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

type FilterType = "all" | "public" | "unlisted" | "private" | "processing";
type SortType = "newest" | "oldest" | "views" | "likes";

const filterOptions: { value: FilterType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "public", label: "Public" },
  { value: "unlisted", label: "Unlisted" },
  { value: "private", label: "Private" },
  { value: "processing", label: "Processing" },
];

const sortOptions: { value: SortType; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "views", label: "Most views" },
  { value: "likes", label: "Most likes" },
];

export function VideoListClient({ videos: initialVideos }: VideoListClientProps) {
  const [videos, setVideos] = useState(initialVideos);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("newest");
  const [featuredVideoId, setFeaturedVideoId] = useState<string | null>(null);

  // Fetch current featured video on mount
  useEffect(() => {
    fetch("/api/channel/featured-video")
      .then((r) => r.json())
      .then((data) => setFeaturedVideoId(data.featured_video_id))
      .catch(() => {});
  }, []);

  const handleSetFeatured = async (videoId: string) => {
    const newFeaturedId = featuredVideoId === videoId ? null : videoId;

    try {
      const res = await fetch("/api/channel/featured-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_id: newFeaturedId }),
      });

      if (res.ok) {
        setFeaturedVideoId(newFeaturedId);
        toast.success(newFeaturedId ? "Video set as featured" : "Featured video removed");
      } else {
        toast.error("Failed to update featured video");
      }
    } catch {
      toast.error("Failed to update featured video");
    }
  };

  const filteredAndSortedVideos = useMemo(() => {
    let result = [...videos];

    // Apply filter
    if (filter !== "all") {
      if (filter === "processing") {
        result = result.filter((v) => v.status !== "ready" && v.status !== "ready");
      } else {
        result = result.filter(
          (v) => (v.status === "ready" || v.status === "ready") && v.visibility === filter
        );
      }
    }

    // Apply sort
    result.sort((a, b) => {
      switch (sort) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "views":
          return (b.views_count || 0) - (a.views_count || 0);
        case "likes":
          return (b.likes_count || 0) - (a.likes_count || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [videos, filter, sort]);

  const allSelected = selectedIds.size === filteredAndSortedVideos.length && filteredAndSortedVideos.length > 0;
  const someSelected = selectedIds.size > 0;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAndSortedVideos.map((v) => v.id)));
    }
  };

  const handleBulkVisibility = async (visibility: "public" | "unlisted" | "private") => {
    if (selectedIds.size === 0) return;

    setIsProcessing(true);
    try {
      const promises = Array.from(selectedIds).map((id) =>
        fetch(`/api/videos/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visibility }),
        })
      );

      const results = await Promise.all(promises);
      const successCount = results.filter((r) => r.ok).length;

      if (successCount > 0) {
        setVideos((prev) =>
          prev.map((v) =>
            selectedIds.has(v.id) ? { ...v, visibility } : v
          )
        );
        toast.success(`Changed visibility for ${successCount} video(s)`);
      }

      setSelectedIds(new Set());
    } catch {
      toast.error("Failed to update visibility");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    const confirmMessage = `Are you sure you want to delete ${selectedIds.size} video(s)? This action cannot be undone.`;
    if (!confirm(confirmMessage)) return;

    setIsProcessing(true);
    try {
      const promises = Array.from(selectedIds).map((id) =>
        fetch(`/api/videos/${id}`, { method: "DELETE" })
      );

      const results = await Promise.all(promises);
      const successCount = results.filter((r) => r.ok).length;

      if (successCount > 0) {
        setVideos((prev) => prev.filter((v) => !selectedIds.has(v.id)));
        toast.success(`Deleted ${successCount} video(s)`);
      }

      setSelectedIds(new Set());
    } catch {
      toast.error("Failed to delete videos");
    } finally {
      setIsProcessing(false);
    }
  };

  if (videos.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg
            className="w-10 h-10 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No videos yet</h2>
        <p className="text-gray-600 mb-4">Upload your first video to get started</p>
        <Link
          href="/studio/upload"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Upload video
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Sort */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1">
          {filterOptions.map((option) => {
            const count =
              option.value === "all"
                ? videos.length
                : option.value === "processing"
                ? videos.filter((v) => v.status !== "ready" && v.status !== "ready").length
                : videos.filter(
                    (v) =>
                      (v.status === "ready" || v.status === "ready") &&
                      v.visibility === option.value
                  ).length;

            return (
              <button
                key={option.value}
                onClick={() => {
                  setFilter(option.value);
                  setSelectedIds(new Set());
                }}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  filter === option.value
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {option.label}
                <span className="ml-1.5 text-xs text-gray-400">({count})</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-gray-400" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortType)}
            className="text-sm border-0 bg-transparent text-gray-600 focus:ring-0 cursor-pointer"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk actions bar */}
      {someSelected && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-indigo-700">
            {selectedIds.size} video(s) selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkVisibility("public")}
              disabled={isProcessing}
            >
              <Globe className="w-4 h-4 mr-1" />
              Public
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkVisibility("unlisted")}
              disabled={isProcessing}
            >
              <EyeOff className="w-4 h-4 mr-1" />
              Unlisted
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkVisibility("private")}
              disabled={isProcessing}
            >
              <Lock className="w-4 h-4 mr-1" />
              Private
            </Button>
            <div className="w-px h-6 bg-indigo-200 mx-1" />
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-1" />
              )}
              Delete
            </Button>
          </div>
        </div>
      )}

      {filteredAndSortedVideos.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <Filter className="w-10 h-10 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600">No videos match the current filter</p>
          <button
            onClick={() => setFilter("all")}
            className="mt-2 text-sm text-indigo-600 hover:underline"
          >
            Clear filter
          </button>
        </div>
      ) : (
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="w-12 py-3 px-4">
                <button
                  onClick={toggleSelectAll}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {allSelected ? (
                    <CheckSquare className="w-5 h-5 text-indigo-600" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Video</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Visibility</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Views</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Comments</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Likes</th>
              <th className="w-12 py-3 px-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredAndSortedVideos.map((video) => (
              <tr
                key={video.id}
                className={`hover:bg-gray-50 ${
                  selectedIds.has(video.id) ? "bg-indigo-50/50" : ""
                }`}
              >
                <td className="py-4 px-4">
                  <button
                    onClick={() => toggleSelect(video.id)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {selectedIds.has(video.id) ? (
                      <CheckSquare className="w-5 h-5 text-indigo-600" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                </td>
                <td className="py-4 px-4">
                  <Link
                    href={`/studio/videos/${video.id}`}
                    className="flex items-center gap-4"
                  >
                    <div className="w-32 aspect-video bg-gray-200 rounded-lg overflow-hidden shrink-0">
                      {(video.thumbnail_url || video.thumbnail_key) ? (
                        <img
                          src={video.thumbnail_url || `${CDN_URL}/${video.thumbnail_key}`}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg
                            className="w-8 h-8 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 line-clamp-2 hover:text-indigo-600 transition-colors">
                        {video.title}
                      </p>
                      {video.description && (
                        <p className="text-sm text-gray-500 line-clamp-1 mt-1">
                          {video.description}
                        </p>
                      )}
                    </div>
                  </Link>
                </td>
                <td className="py-4 px-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full ${
                      video.status !== "ready" && video.status !== "ready"
                        ? "bg-yellow-100 text-yellow-700"
                        : video.visibility === "public"
                        ? "bg-green-100 text-green-700"
                        : video.visibility === "unlisted"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {video.status !== "ready" && video.status !== "ready" ? (
                      <>
                        <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />
                        {video.status}
                      </>
                    ) : (
                      <>
                        {video.visibility === "public" && <Globe className="w-3 h-3" />}
                        {video.visibility === "unlisted" && <EyeOff className="w-3 h-3" />}
                        {video.visibility === "private" && <Lock className="w-3 h-3" />}
                        {video.visibility || "public"}
                      </>
                    )}
                  </span>
                </td>
                <td className="py-4 px-4 text-sm text-gray-600">
                  {formatDate(video.created_at)}
                </td>
                <td className="py-4 px-4 text-right text-sm text-gray-900">
                  {formatNumber(video.views_count || 0)}
                </td>
                <td className="py-4 px-4 text-right text-sm text-gray-900">
                  {formatNumber(video.comments_count || 0)}
                </td>
                <td className="py-4 px-4 text-right text-sm text-gray-900">
                  {formatNumber(video.likes_count || 0)}
                </td>
                <td className="py-4 px-4">
                  {video.status === "ready" && video.visibility === "public" && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleSetFeatured(video.id);
                      }}
                      title={featuredVideoId === video.id ? "Remove from featured" : "Set as featured video"}
                      className={`p-1.5 rounded-lg transition-colors ${
                        featuredVideoId === video.id
                          ? "text-yellow-500 bg-yellow-50 hover:bg-yellow-100"
                          : "text-gray-400 hover:text-yellow-500 hover:bg-gray-100"
                      }`}
                    >
                      <Star className={`w-4 h-4 ${featuredVideoId === video.id ? "fill-current" : ""}`} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}
