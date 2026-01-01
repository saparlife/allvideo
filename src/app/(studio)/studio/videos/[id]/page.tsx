"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Upload, Loader2, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || "https://cdn.lovsell.com";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://video.lovsell.com";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Video {
  id: string;
  title: string;
  description: string | null;
  slug: string | null;
  thumbnail_key: string | null;
  thumbnail_url: string | null;
  hls_key: string | null;
  duration: number | null;
  views_count: number;
  likes_count: number;
  comments_count: number;
  status: string;
  visibility: string;
  tags: string[] | null;
  category_id: string | null;
  scheduled_at: string | null;
  created_at: string;
}

export default function VideoEditPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("studio");
  const [video, setVideo] = useState<Video | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [tags, setTags] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [isScheduled, setIsScheduled] = useState(false);

  useEffect(() => {
    fetchVideo();
    fetchCategories();
  }, [params.id]);

  const fetchCategories = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("categories")
      .select("id, name, slug")
      .eq("is_active", true)
      .order("sort_order");
    if (data) {
      setCategories(data);
    }
  };

  const fetchVideo = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/videos/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setVideo(data.video);
        setTitle(data.video.title || "");
        setDescription(data.video.description || "");
        setVisibility(data.video.visibility || "public");
        setTags(data.video.tags?.join(", ") || "");
        setCategoryId(data.video.category_id || "");
        if (data.video.scheduled_at) {
          setIsScheduled(true);
          // Convert to local datetime format for input
          const date = new Date(data.video.scheduled_at);
          setScheduledAt(date.toISOString().slice(0, 16));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!video) return;
    setSaving(true);

    try {
      const response = await fetch(`/api/videos/${video.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          visibility: isScheduled ? "private" : visibility, // Scheduled videos start as private
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
          category_id: categoryId || null,
          scheduled_at: isScheduled && scheduledAt ? new Date(scheduledAt).toISOString() : null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setVideo(data.video);
        toast.success("Video saved");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to save");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!video || !confirm("Are you sure you want to delete this video?")) return;
    setDeleting(true);

    try {
      const response = await fetch(`/api/videos/${video.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/studio/videos");
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !video) return;

    // Validate file type
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Please upload a JPEG, PNG, or WebP image");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setUploadingThumbnail(true);

    try {
      const formData = new FormData();
      formData.append("thumbnail", file);

      const response = await fetch(`/api/videos/${video.id}/thumbnail`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setVideo(data.video);
        toast.success("Thumbnail updated");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to upload thumbnail");
      }
    } catch {
      toast.error("Failed to upload thumbnail");
    } finally {
      setUploadingThumbnail(false);
      // Reset input
      if (thumbnailInputRef.current) {
        thumbnailInputRef.current.value = "";
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6" />
          <div className="bg-white rounded-xl border p-6">
            <div className="aspect-video bg-gray-200 rounded-lg mb-6" />
            <div className="space-y-4">
              <div className="h-10 bg-gray-200 rounded" />
              <div className="h-32 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Video not found</h1>
        <Link href="/studio/videos" className="text-indigo-600 hover:underline cursor-pointer">
          Back to videos
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("videoDetails")}</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            {deleting ? "Deleting..." : t("deleteVideo")}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border p-6">
            {/* Title */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                placeholder="Enter video title"
              />
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none"
                placeholder="Describe your video"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("tags")}
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                placeholder={t("tagsPlaceholder")}
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Thumbnail */}
          <div className="bg-white rounded-xl border p-4">
            <h3 className="font-medium text-gray-900 mb-3">Thumbnail</h3>
            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden mb-4 relative group">
              {video.thumbnail_url || video.thumbnail_key ? (
                <img
                  src={video.thumbnail_url || `${CDN_URL}/${video.thumbnail_key}`}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-gray-600" />
                </div>
              )}

              {/* Upload overlay */}
              <div
                className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => thumbnailInputRef.current?.click()}
              >
                {uploadingThumbnail ? (
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                ) : (
                  <div className="text-center text-white">
                    <Upload className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">Click to upload</p>
                  </div>
                )}
              </div>
            </div>

            <input
              ref={thumbnailInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleThumbnailUpload}
              className="hidden"
            />

            <button
              onClick={() => thumbnailInputRef.current?.click()}
              disabled={uploadingThumbnail}
              className="flex items-center justify-center gap-2 w-full py-2 text-sm text-gray-600 hover:bg-gray-50 border rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {uploadingThumbnail ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              Upload custom thumbnail
            </button>

            <p className="text-xs text-gray-500 mt-2 text-center">
              JPEG, PNG, or WebP. Max 5MB.
            </p>

            <div className="border-t mt-4 pt-4">
              <a
                href={`/watch/${video.slug || video.id}`}
                target="_blank"
                className="flex items-center justify-center gap-2 w-full py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View on UnlimVideo
              </a>
            </div>
          </div>

          {/* Category */}
          <div className="bg-white rounded-xl border p-4">
            <h3 className="font-medium text-gray-900 mb-3">Category</h3>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none cursor-pointer"
            >
              <option value="">No category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Visibility */}
          <div className="bg-white rounded-xl border p-4">
            <h3 className="font-medium text-gray-900 mb-3">{t("visibility")}</h3>
            <div className="space-y-2">
              {[
                { value: "public", label: t("public"), icon: "🌍" },
                { value: "unlisted", label: t("unlisted"), icon: "🔗" },
                { value: "private", label: t("private"), icon: "🔒" },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    visibility === option.value && !isScheduled
                      ? "bg-indigo-50 border border-indigo-200"
                      : "hover:bg-gray-50"
                  } ${isScheduled ? "opacity-50" : ""}`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value={option.value}
                    checked={visibility === option.value}
                    onChange={(e) => {
                      setVisibility(e.target.value);
                      setIsScheduled(false);
                    }}
                    disabled={isScheduled}
                    className="hidden"
                  />
                  <span>{option.icon}</span>
                  <span className={visibility === option.value && !isScheduled ? "font-medium" : ""}>
                    {option.label}
                  </span>
                </label>
              ))}
            </div>

            {/* Schedule option */}
            <div className="mt-4 pt-4 border-t">
              <label
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  isScheduled
                    ? "bg-indigo-50 border border-indigo-200"
                    : "hover:bg-gray-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isScheduled}
                  onChange={(e) => {
                    setIsScheduled(e.target.checked);
                    if (e.target.checked) {
                      // Default to 1 hour from now
                      const defaultDate = new Date(Date.now() + 60 * 60 * 1000);
                      setScheduledAt(defaultDate.toISOString().slice(0, 16));
                    }
                  }}
                  className="hidden"
                />
                <span>📅</span>
                <span className={isScheduled ? "font-medium" : ""}>
                  Schedule
                </span>
              </label>

              {isScheduled && (
                <div className="mt-3 pl-3">
                  <label className="block text-xs text-gray-500 mb-1">
                    Publish date & time
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Video will be published automatically at this time
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Embed Code */}
          {video.status === "ready" && video.hls_key && (
            <div className="bg-white rounded-xl border p-4">
              <h3 className="font-medium text-gray-900 mb-3">Embed Code</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Embed URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${SITE_URL}/embed/${video.id}`}
                      className="flex-1 px-3 py-2 bg-gray-50 border rounded-lg text-sm text-gray-700"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${SITE_URL}/embed/${video.id}`);
                        toast.success("Copied!");
                      }}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors cursor-pointer"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">HTML Iframe</label>
                  <div className="relative">
                    <textarea
                      readOnly
                      rows={3}
                      value={`<iframe src="${SITE_URL}/embed/${video.id}" width="640" height="360" frameborder="0" allowfullscreen></iframe>`}
                      className="w-full px-3 py-2 bg-gray-50 border rounded-lg text-xs text-gray-700 font-mono resize-none"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`<iframe src="${SITE_URL}/embed/${video.id}" width="640" height="360" frameborder="0" allowfullscreen></iframe>`);
                        toast.success("Copied!");
                      }}
                      className="absolute top-2 right-2 px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs transition-colors cursor-pointer"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">HLS URL (m3u8)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${CDN_URL}/${video.hls_key}`}
                      className="flex-1 px-3 py-2 bg-gray-50 border rounded-lg text-sm text-gray-700 font-mono"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${CDN_URL}/${video.hls_key}`);
                        toast.success("Copied!");
                      }}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors cursor-pointer"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="bg-white rounded-xl border p-4">
            <h3 className="font-medium text-gray-900 mb-3">Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Views</span>
                <span className="font-medium">{video.views_count || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Likes</span>
                <span className="font-medium">{video.likes_count || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Comments</span>
                <span className="font-medium">{video.comments_count || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Status</span>
                <span
                  className={`font-medium ${
                    video.status === "ready"
                      ? "text-green-600"
                      : "text-yellow-600"
                  }`}
                >
                  {video.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
