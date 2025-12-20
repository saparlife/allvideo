import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Video as VideoIcon } from "lucide-react";

interface VideoWithUser {
  id: string;
  title: string;
  status: string;
  original_size_bytes: number;
  duration_seconds: number | null;
  created_at: string;
  user: {
    email: string;
    name: string | null;
  };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "-";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getStatusColor(status: string): string {
  switch (status) {
    case "ready":
      return "bg-green-600";
    case "processing":
      return "bg-yellow-600";
    case "uploading":
      return "bg-blue-600";
    case "failed":
      return "bg-red-600";
    default:
      return "bg-gray-600";
  }
}

export default async function AdminVideosPage() {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: videos } = await (supabase as any)
    .from("videos")
    .select(`
      id,
      title,
      status,
      original_size_bytes,
      duration_seconds,
      created_at,
      user:users(email, name)
    `)
    .order("created_at", { ascending: false })
    .limit(100) as { data: VideoWithUser[] | null };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">All Videos</h1>
        <p className="text-gray-400">View and manage all videos in the system</p>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Videos</CardTitle>
        </CardHeader>
        <CardContent>
          {videos && videos.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800">
                  <TableHead className="text-gray-400">Title</TableHead>
                  <TableHead className="text-gray-400">User</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-gray-400">Size</TableHead>
                  <TableHead className="text-gray-400">Duration</TableHead>
                  <TableHead className="text-gray-400">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {videos.map((video) => (
                  <TableRow key={video.id} className="border-gray-800">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center">
                          <VideoIcon className="w-4 h-4 text-gray-400" />
                        </div>
                        <span className="font-medium text-white truncate max-w-[200px]">
                          {video.title}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-white text-sm">{video.user?.name || "No name"}</p>
                        <p className="text-gray-500 text-xs">{video.user?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(video.status)}>
                        {video.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {formatBytes(video.original_size_bytes)}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {formatDuration(video.duration_seconds)}
                    </TableCell>
                    <TableCell className="text-gray-400">
                      {new Date(video.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-gray-400">
              No videos found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
