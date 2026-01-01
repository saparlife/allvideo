import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Radio, Copy, Settings, MessageSquare, Users, Eye, ArrowLeft } from "lucide-react";
import { StreamKeyDisplay } from "./stream-key-display";
import { StreamStatusBadge } from "./stream-status-badge";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function StreamManagePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get stream
  const { data: stream, error } = await (supabase as any)
    .from("streams")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !stream) {
    notFound();
  }

  const isLive = stream.status === "live";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/studio/live"
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{stream.title}</h1>
            <StreamStatusBadge status={stream.status} />
          </div>
          {stream.description && (
            <p className="text-gray-600 mt-1">{stream.description}</p>
          )}
        </div>
      </div>

      {/* Live banner */}
      {isLive && (
        <div className="bg-red-500 text-white rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
              <Radio className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">You're Live!</h2>
              <p className="opacity-90">
                {stream.total_views || 0} total views • {stream.peak_viewers || 0} peak viewers
              </p>
            </div>
            <Link
              href={`/live/${id}`}
              target="_blank"
              className="px-4 py-2 bg-white text-red-600 rounded-lg font-medium hover:bg-gray-100"
            >
              View Stream
            </Link>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stream Settings */}
          <div className="bg-white border rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-400" />
              Stream Configuration
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500 block mb-1">RTMP Server URL</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-gray-100 rounded-lg text-sm font-mono overflow-x-auto">
                    rtmp://live.unlimvideo.com/live
                  </code>
                  <button
                    className="p-2 hover:bg-gray-100 rounded-lg shrink-0"
                    onClick={() => navigator.clipboard.writeText("rtmp://live.unlimvideo.com/live")}
                  >
                    <Copy className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>

              <StreamKeyDisplay streamKey={stream.stream_key} />

              <div className="pt-4 border-t">
                <h4 className="font-medium text-gray-900 mb-2">How to Go Live</h4>
                <ol className="text-sm text-gray-600 space-y-2">
                  <li className="flex gap-2">
                    <span className="font-bold text-indigo-600">1.</span>
                    Open OBS, Streamlabs, or your preferred streaming software
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-indigo-600">2.</span>
                    Go to Settings → Stream
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-indigo-600">3.</span>
                    Select "Custom" and paste the server URL and stream key
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-indigo-600">4.</span>
                    Click "Start Streaming"
                  </li>
                </ol>
              </div>
            </div>
          </div>

          {/* Stream info */}
          <div className="bg-white border rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Stream Details</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500 block mb-1">Title</label>
                <p className="font-medium">{stream.title}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-1">Visibility</label>
                <p className="font-medium capitalize">{stream.visibility}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-1">Chat</label>
                <p className="font-medium">{stream.chat_enabled ? "Enabled" : "Disabled"}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-1">Recording</label>
                <p className="font-medium">{stream.record_stream ? "Enabled" : "Disabled"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="bg-white border rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Statistics</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stream.total_views || 0}</p>
                  <p className="text-sm text-gray-500">Total Views</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stream.peak_viewers || 0}</p>
                  <p className="text-sm text-gray-500">Peak Viewers</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">-</p>
                  <p className="text-sm text-gray-500">Chat Messages</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white border rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                href={`/live/${id}`}
                target="_blank"
                className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-center block"
              >
                Preview Stream
              </Link>
              <button className="w-full px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium">
                Edit Settings
              </button>
              {stream.status === "ended" && stream.recording_video_id && (
                <Link
                  href={`/watch/${stream.recording_video_id}`}
                  className="w-full px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium text-center block"
                >
                  View Recording
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
