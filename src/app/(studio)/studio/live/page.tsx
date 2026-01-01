import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Radio, Settings, Copy, Eye, Clock, Video } from "lucide-react";
import { CreateStreamButton } from "./create-stream-button";

function generateStreamKey(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let key = "live_";
  for (let i = 0; i < 24; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

export default async function StudioLivePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's streams
  const { data: streams } = await (supabase as any)
    .from("streams")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const streamList = streams || [];
  const activeStream = streamList.find((s: any) => s.status === "live");
  const recentStreams = streamList.filter((s: any) => s.status !== "live").slice(0, 10);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Streaming</h1>
          <p className="text-gray-600">Stream live to your audience</p>
        </div>
        <CreateStreamButton />
      </div>

      {/* Active stream banner */}
      {activeStream && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
              <Radio className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-red-900">You're Live!</h2>
              <p className="text-red-700">{activeStream.title}</p>
            </div>
            <Link
              href={`/studio/live/${activeStream.id}`}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
            >
              Manage Stream
            </Link>
          </div>
        </div>
      )}

      {/* Stream setup guide */}
      {streamList.length === 0 && (
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-8 text-white">
          <div className="max-w-2xl">
            <Radio className="w-12 h-12 mb-4 opacity-80" />
            <h2 className="text-2xl font-bold mb-2">Start Your First Live Stream</h2>
            <p className="opacity-90 mb-6">
              Go live and connect with your audience in real-time. Set up your stream
              in minutes using OBS, Streamlabs, or any RTMP-compatible software.
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-3xl font-bold">1</div>
                <p className="text-sm opacity-80">Create a stream and get your stream key</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-3xl font-bold">2</div>
                <p className="text-sm opacity-80">Configure your streaming software</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-3xl font-bold">3</div>
                <p className="text-sm opacity-80">Go live and engage with viewers</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stream settings info */}
      {streamList.length > 0 && (
        <div className="bg-white border rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-400" />
            Streaming Setup
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500 block mb-1">RTMP Server</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-gray-100 rounded text-sm font-mono">
                  rtmp://live.unlimvideo.com/live
                </code>
                <button className="p-2 hover:bg-gray-100 rounded">
                  <Copy className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-500 block mb-1">Stream Key</label>
              <p className="text-sm text-gray-600">
                Each stream has its own unique key. Create a new stream to get a key.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recent streams */}
      {recentStreams.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Previous Streams</h3>
          <div className="bg-white border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Stream</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Peak Viewers</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentStreams.map((stream: any) => (
                  <tr key={stream.id} className="hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Video className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{stream.title}</p>
                          {stream.recording_video_id && (
                            <Link
                              href={`/watch/${stream.recording_video_id}`}
                              className="text-xs text-indigo-600 hover:underline"
                            >
                              View recording
                            </Link>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        stream.status === "ended" ? "bg-gray-100 text-gray-600" : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {stream.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {new Date(stream.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-right text-sm text-gray-900">
                      <div className="flex items-center justify-end gap-1">
                        <Eye className="w-4 h-4 text-gray-400" />
                        {stream.peak_viewers || 0}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
