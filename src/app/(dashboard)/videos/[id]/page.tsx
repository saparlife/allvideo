import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VideoPlayer } from "@/components/video/video-player";
import { CopyButton } from "@/components/video/copy-button";
import { ArrowLeft, Eye, Clock, HardDrive, Timer, Link2, Code } from "lucide-react";
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
      return <Badge className="bg-emerald-500 text-white">Ready</Badge>;
    case "processing":
      return <Badge className="bg-yellow-500 text-white">Processing</Badge>;
    case "uploading":
      return <Badge className="bg-blue-500 text-white">Uploading</Badge>;
    case "failed":
      return <Badge className="bg-red-500 text-white">Failed</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

function formatWaitTime(minutes: number): string {
  if (minutes < 1) return "less than a minute";
  if (minutes < 5) return "2-5 minutes";
  if (minutes < 15) return "10-15 minutes";
  if (minutes < 30) return "20-30 minutes";
  if (minutes < 60) return "30-60 minutes";
  const hours = Math.ceil(minutes / 60);
  return `${hours}-${hours + 1} hours`;
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

  // Get queue position if video is processing
  let queuePosition = 0;
  let estimatedWaitMinutes = 0;

  if (video.status === "processing" || video.status === "uploading") {
    // Count jobs ahead in queue (pending or processing, created before this video)
    const { count } = await supabase
      .from("transcode_jobs")
      .select("*", { count: "exact", head: true })
      .in("status", ["pending", "processing"])
      .lt("created_at", video.created_at);

    queuePosition = (count || 0) + 1; // +1 for current video
    // Average ~4 minutes per video transcode
    estimatedWaitMinutes = queuePosition * 4;
  }

  const r2Url = (process.env.R2_PUBLIC_URL || "").trim();

  const hlsUrl = video.hls_key
    ? `${r2Url}/${video.hls_key}`
    : null;

  const thumbnailUrl = video.thumbnail_key
    ? `${r2Url}/${video.thumbnail_key}`
    : undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="text-gray-600 hover:text-gray-900 hover:bg-gray-100">
          <Link href="/media">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{video.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            {getStatusBadge(video.status)}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Video Player */}
        <div className="lg:col-span-2">
          <Card className="bg-white border-gray-200 overflow-hidden">
            <CardContent className="p-0">
              {video.status === "ready" && hlsUrl ? (
                <VideoPlayer src={hlsUrl} poster={thumbnailUrl} />
              ) : video.status === "processing" || video.status === "uploading" ? (
                <div className="aspect-video bg-gray-100 flex items-center justify-center">
                  <div className="text-center px-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                    <p className="text-gray-700 font-medium mb-2">
                      {video.status === "uploading" ? "Uploading..." : "Processing video..."}
                    </p>
                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 inline-block">
                      <div className="flex items-center gap-2 text-indigo-700">
                        <Timer className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Estimated wait: {formatWaitTime(estimatedWaitMinutes)}
                        </span>
                      </div>
                      {queuePosition > 1 && (
                        <p className="text-xs text-indigo-600 mt-1">
                          Position in queue: {queuePosition}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-3">
                      You can close this page. We&apos;ll process your video in the background.
                    </p>
                  </div>
                </div>
              ) : video.status === "failed" ? (
                <div className="aspect-video bg-gray-100 flex items-center justify-center">
                  <div className="text-center text-red-500">
                    <p>Failed to process video</p>
                    {video.error_message && (
                      <p className="text-sm mt-2">{video.error_message}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="aspect-video bg-gray-100 flex items-center justify-center">
                  <p className="text-gray-500">Video not available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          {video.description && (
            <Card className="bg-white border-gray-200 mt-4">
              <CardHeader>
                <CardTitle className="text-gray-900 text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{video.description}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Stats */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900 text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Views
                </span>
                <span className="text-gray-900 font-medium">{video.views_count}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Duration
                </span>
                <span className="text-gray-900 font-medium">{formatDuration(video.duration_seconds)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  Size
                </span>
                <span className="text-gray-900 font-medium">{formatBytes(video.original_size_bytes)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Uploaded</span>
                <span className="text-gray-900 font-medium">
                  {new Date(video.created_at).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* HLS URL - only show when ready */}
          {video.status === "ready" && hlsUrl && (
            <Card className="bg-white border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-gray-900 text-lg flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  HLS URL
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 rounded-lg p-3 break-all">
                  <code className="text-xs text-gray-700">{hlsUrl}</code>
                </div>
                <CopyButton text={hlsUrl} label="Copy URL" />
              </CardContent>
            </Card>
          )}

          {/* Embed Code - only show when ready */}
          {video.status === "ready" && hlsUrl && (
            <Card className="bg-white border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-gray-900 text-lg flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Embed Code
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 rounded-lg p-3">
                  <code className="text-xs text-gray-700 break-all">
                    {`<iframe src="${process.env.NEXT_PUBLIC_APP_URL || 'https://unlimvideo.one'}/embed/${video.id}" width="640" height="360" frameborder="0" allowfullscreen></iframe>`}
                  </code>
                </div>
                <CopyButton
                  text={`<iframe src="${process.env.NEXT_PUBLIC_APP_URL || 'https://unlimvideo.one'}/embed/${video.id}" width="640" height="360" frameborder="0" allowfullscreen></iframe>`}
                  label="Copy Embed Code"
                />
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
