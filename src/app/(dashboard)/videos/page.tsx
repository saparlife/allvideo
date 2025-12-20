import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Video, Clock, Eye, MoreVertical } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Video as VideoType } from "@/types/database";

function formatDuration(seconds: number | null): string {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getStatusBadge(status: string) {
  switch (status) {
    case "ready":
      return <Badge className="bg-green-600">Ready</Badge>;
    case "processing":
      return <Badge className="bg-yellow-600">Processing</Badge>;
    case "uploading":
      return <Badge className="bg-blue-600">Uploading</Badge>;
    case "failed":
      return <Badge className="bg-red-600">Failed</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

export default async function VideosPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: videos } = await supabase
    .from("videos")
    .select("*")
    .eq("user_id", user!.id)
    .neq("status", "deleted")
    .order("created_at", { ascending: false }) as { data: VideoType[] | null };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Videos</h1>
          <p className="text-gray-400">
            Manage your video library
          </p>
        </div>
        <Button asChild>
          <Link href="/videos/upload">
            <Plus className="mr-2 h-4 w-4" />
            Upload Video
          </Link>
        </Button>
      </div>

      {/* Videos Grid */}
      {videos && videos.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <Card key={video.id} className="bg-gray-900 border-gray-800 overflow-hidden">
              {/* Thumbnail */}
              <div className="aspect-video bg-gray-800 relative">
                {video.thumbnail_key ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`${process.env.R2_PUBLIC_URL}/${video.thumbnail_key}`}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="h-12 w-12 text-gray-600" />
                  </div>
                )}
                {video.duration_seconds && (
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                    {formatDuration(video.duration_seconds)}
                  </div>
                )}
              </div>

              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white truncate">
                      {video.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {video.views_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(video.created_at).toLocaleDateString()}
                      </span>
                      <span>{formatBytes(video.original_size_bytes)}</span>
                    </div>
                    <div className="mt-2">
                      {getStatusBadge(video.status)}
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                      <DropdownMenuItem asChild className="text-gray-300">
                        <Link href={`/videos/${video.id}`}>View Details</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-gray-300">
                        Copy HLS URL
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-gray-300">
                        Get Embed Code
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-400">
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">No videos yet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Video className="h-12 w-12 mx-auto text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                Upload your first video
              </h3>
              <p className="text-gray-400 mb-4">
                Start building your video library
              </p>
              <Button asChild>
                <Link href="/videos/upload">
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Video
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
