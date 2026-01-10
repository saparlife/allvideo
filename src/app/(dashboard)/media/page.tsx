"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Video,
  Image,
  Music,
  FileText,
  Clock,
  Eye,
  MoreVertical,
  Loader2,
  Trash2,
  FolderOpen,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MediaItem {
  id: string;
  title: string;
  status: string;
  media_type: string;
  original_size_bytes: number;
  duration_seconds: number | null;
  width: number | null;
  height: number | null;
  views_count: number;
  thumbnail_key: string | null;
  original_key: string | null;
  custom_metadata: Record<string, unknown>;
  created_at: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    ready: "bg-green-100 text-green-700",
    processing: "bg-yellow-100 text-yellow-700",
    uploading: "bg-blue-100 text-blue-700",
    failed: "bg-red-100 text-red-700",
  };
  return <Badge className={styles[status] || "bg-gray-100"}>{status}</Badge>;
}

function getTypeIcon(type: string) {
  switch (type) {
    case "video":
      return <Video className="w-5 h-5" />;
    case "image":
      return <Image className="w-5 h-5" />;
    case "audio":
      return <Music className="w-5 h-5" />;
    case "file":
      return <FileText className="w-5 h-5" />;
    default:
      return <FolderOpen className="w-5 h-5" />;
  }
}

export default function MediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const supabase = createClient();
  const r2Url = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";

  useEffect(() => {
    async function loadMedia() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from("videos")
        .select("*")
        .eq("user_id", user.id)
        .neq("status", "deleted")
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("media_type", filter);
      }

      const { data } = await query;
      setMedia((data as MediaItem[]) || []);
      setLoading(false);
    }

    loadMedia();
  }, [supabase, filter]);

  const handleDelete = async (item: MediaItem) => {
    if (!confirm(`Delete "${item.title}"? This cannot be undone.`)) return;

    setDeletingId(item.id);
    try {
      const endpoint = `/api/v1/${item.media_type}s/${item.id}`;
      const response = await fetch(endpoint, { method: "DELETE" });

      if (!response.ok) {
        // Fallback to old API
        await fetch(`/api/videos/${item.id}`, { method: "DELETE" });
      }

      setMedia(media.filter((m) => m.id !== item.id));
      toast.success(`Deleted "${item.title}"`);
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  const counts = {
    all: media.length,
    video: media.filter((m) => m.media_type === "video" || !m.media_type).length,
    image: media.filter((m) => m.media_type === "image").length,
    audio: media.filter((m) => m.media_type === "audio").length,
    file: media.filter((m) => m.media_type === "file").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Media</h1>
          <p className="text-gray-500">All your videos, images, audio, and files</p>
        </div>
        <Button asChild className="bg-gray-900 hover:bg-gray-800 text-white">
          <Link href="/media/upload">
            <Plus className="mr-2 h-4 w-4" />
            Upload
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="bg-gray-100">
          <TabsTrigger value="all" className="data-[state=active]:bg-white">
            All ({counts.all})
          </TabsTrigger>
          <TabsTrigger value="video" className="data-[state=active]:bg-white">
            <Video className="w-4 h-4 mr-1" /> Videos ({counts.video})
          </TabsTrigger>
          <TabsTrigger value="image" className="data-[state=active]:bg-white">
            <Image className="w-4 h-4 mr-1" /> Images ({counts.image})
          </TabsTrigger>
          <TabsTrigger value="audio" className="data-[state=active]:bg-white">
            <Music className="w-4 h-4 mr-1" /> Audio ({counts.audio})
          </TabsTrigger>
          <TabsTrigger value="file" className="data-[state=active]:bg-white">
            <FileText className="w-4 h-4 mr-1" /> Files ({counts.file})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Media Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : media.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {media.map((item) => {
            let detailUrl = `/videos/${item.id}`;
            if (item.media_type === "image") {
              detailUrl = `/images/${item.id}`;
            } else if (item.media_type === "audio") {
              detailUrl = `/audio/${item.id}`;
            } else if (item.media_type === "file") {
              detailUrl = `/files/${item.id}`;
            }
            return (
            <Card key={item.id} className="bg-white border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group">
              {/* Thumbnail */}
              <Link href={detailUrl} className="block">
              <div className="aspect-video bg-gray-100 relative">
                {item.thumbnail_key ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`${r2Url}/${item.thumbnail_key}`}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : item.media_type === "image" && item.original_key ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`${r2Url}/${item.original_key}`}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    {getTypeIcon(item.media_type || "video")}
                  </div>
                )}
                {item.duration_seconds && (
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                    {formatDuration(item.duration_seconds)}
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <Badge className="bg-white/90 text-gray-700 text-xs">
                    {getTypeIcon(item.media_type || "video")}
                  </Badge>
                </div>
              </div>
              </Link>

              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{item.title}</h3>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      {item.media_type === "video" && (
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {item.views_count}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                      <span>{formatBytes(item.original_size_bytes)}</span>
                    </div>
                    <div className="mt-2">{getStatusBadge(item.status)}</div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white">
                      <DropdownMenuItem
                        className="text-red-500"
                        onClick={() => handleDelete(item)}
                        disabled={deletingId === item.id}
                      >
                        {deletingId === item.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          );
          })}
        </div>
      ) : (
        <Card className="bg-white border-gray-200">
          <CardContent className="py-16 text-center">
            <FolderOpen className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No media yet</h3>
            <p className="text-gray-500 mb-4">Upload your first file to get started</p>
            <Button asChild className="bg-gray-900 hover:bg-gray-800 text-white">
              <Link href="/media/upload">
                <Plus className="mr-2 h-4 w-4" />
                Upload
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
