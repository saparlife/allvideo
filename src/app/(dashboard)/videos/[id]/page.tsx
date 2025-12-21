import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VideoPlayer } from "@/components/video/video-player";
import { CopyButton } from "@/components/video/copy-button";
import { ArrowLeft, Copy, Code, Eye, Clock, HardDrive } from "lucide-react";
import Link from "next/link";
import type { Video } from "@/types/database";

interface Props {
  params: Promise<{ id: string }>;
}

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

export default async function VideoDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: video } = await supabase
    .from("videos")
    .select("*")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single() as { data: Video | null };

  if (!video) {
    notFound();
  }

  const hlsUrl = video.hls_key
    ? `${process.env.R2_PUBLIC_URL}/${video.hls_key}`
    : null;

  const thumbnailUrl = video.thumbnail_key
    ? `${process.env.R2_PUBLIC_URL}/${video.thumbnail_key}`
    : undefined;

  const embedCode = hlsUrl
    ? `<iframe src="${process.env.NEXT_PUBLIC_APP_URL || 'https://allvideo.one'}/embed/${video.id}" width="640" height="360" frameborder="0" allowfullscreen></iframe>`
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/videos">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-white">{video.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            {getStatusBadge(video.status)}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Video Player */}
        <div className="lg:col-span-2">
          <Card className="bg-gray-900 border-gray-800 overflow-hidden">
            <CardContent className="p-0">
              {video.status === "ready" && hlsUrl ? (
                <VideoPlayer src={hlsUrl} poster={thumbnailUrl} />
              ) : video.status === "processing" ? (
                <div className="aspect-video bg-gray-800 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-gray-400">Processing video...</p>
                  </div>
                </div>
              ) : video.status === "failed" ? (
                <div className="aspect-video bg-gray-800 flex items-center justify-center">
                  <div className="text-center text-red-400">
                    <p>Failed to process video</p>
                    {video.error_message && (
                      <p className="text-sm mt-2">{video.error_message}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="aspect-video bg-gray-800 flex items-center justify-center">
                  <p className="text-gray-400">Video not available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          {video.description && (
            <Card className="bg-gray-900 border-gray-800 mt-4">
              <CardHeader>
                <CardTitle className="text-white text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">{video.description}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Stats */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Views
                </span>
                <span className="text-white">{video.views_count}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Duration
                </span>
                <span className="text-white">{formatDuration(video.duration_seconds)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  Size
                </span>
                <span className="text-white">{formatBytes(video.original_size_bytes)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Uploaded</span>
                <span className="text-white">
                  {new Date(video.created_at).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* HLS URL */}
          {hlsUrl && (
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Copy className="h-4 w-4" />
                  HLS URL
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-800 rounded p-3 break-all text-sm text-gray-300 font-mono">
                  {hlsUrl}
                </div>
                <CopyButton text={hlsUrl} label="Copy URL" />
              </CardContent>
            </Card>
          )}

          {/* Embed Code */}
          {embedCode && (
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Embed Code
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-800 rounded p-3 break-all text-sm text-gray-300 font-mono">
                  {embedCode}
                </div>
                <CopyButton text={embedCode} label="Copy Embed Code" />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
