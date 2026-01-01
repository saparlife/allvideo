"use client";

import { useState } from "react";
import { Key, Plus, Copy, Trash2, Check, Eye, EyeOff, ExternalLink } from "lucide-react";

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  permissions: { read: boolean; write: boolean; delete: boolean };
  rate_limit_per_minute: number;
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

interface ApiPageClientProps {
  initialKeys: ApiKey[];
}

const API_ENDPOINTS = [
  {
    method: "GET",
    path: "/api/videos/public",
    description: "Get list of public videos",
    auth: false,
  },
  {
    method: "GET",
    path: "/api/videos/:id",
    description: "Get video details",
    auth: true,
  },
  {
    method: "PATCH",
    path: "/api/videos/:id",
    description: "Update video (title, description, visibility)",
    auth: true,
  },
  {
    method: "DELETE",
    path: "/api/videos/:id",
    description: "Delete video",
    auth: true,
  },
  {
    method: "GET",
    path: "/api/videos/:id/transcript",
    description: "Get video transcript with timestamps",
    auth: false,
  },
  {
    method: "GET",
    path: "/api/videos/:id/subtitles",
    description: "Get VTT subtitles file",
    auth: false,
  },
  {
    method: "POST",
    path: "/api/videos/:id/view",
    description: "Track video view",
    auth: false,
  },
  {
    method: "POST",
    path: "/api/videos/:id/like",
    description: "Like a video",
    auth: true,
  },
  {
    method: "DELETE",
    path: "/api/videos/:id/like",
    description: "Unlike a video",
    auth: true,
  },
  {
    method: "GET",
    path: "/api/videos/:id/comments",
    description: "Get video comments",
    auth: false,
  },
  {
    method: "POST",
    path: "/api/videos/:id/comments",
    description: "Add comment to video",
    auth: true,
  },
  {
    method: "GET",
    path: "/api/playlists",
    description: "Get user playlists",
    auth: true,
  },
  {
    method: "POST",
    path: "/api/playlists",
    description: "Create playlist",
    auth: true,
  },
  {
    method: "GET",
    path: "/api/subscriptions",
    description: "Get user subscriptions",
    auth: true,
  },
  {
    method: "POST",
    path: "/api/subscriptions",
    description: "Subscribe to channel",
    auth: true,
  },
];

export function ApiPageClient({ initialKeys }: ApiPageClientProps) {
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const createKey = async () => {
    if (!newKeyName.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName }),
      });

      if (res.ok) {
        const data = await res.json();
        setNewKey(data.key);
        setKeys([data.apiKey, ...keys]);
        setNewKeyName("");
      }
    } catch (err) {
      console.error("Error creating key:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteKey = async (id: string) => {
    if (!confirm("Are you sure you want to delete this API key?")) return;

    try {
      const res = await fetch(`/api/keys/${id}`, { method: "DELETE" });
      if (res.ok) {
        setKeys(keys.filter((k) => k.id !== id));
      }
    } catch (err) {
      console.error("Error deleting key:", err);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const methodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-green-100 text-green-700";
      case "POST":
        return "bg-blue-100 text-blue-700";
      case "PATCH":
        return "bg-yellow-100 text-yellow-700";
      case "DELETE":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">API</h1>
        <p className="text-gray-600 mt-1">
          Manage API keys and integrate with your applications
        </p>
      </div>

      {/* API Keys Section */}
      <div className="bg-white rounded-lg border p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Key className="w-5 h-5" />
            API Keys
          </h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Key
          </button>
        </div>

        {/* New Key Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Create API Key</h3>

              {newKey ? (
                <div>
                  <p className="text-sm text-gray-600 mb-3">
                    Your API key has been created. Copy it now - you won't be able to see it again.
                  </p>
                  <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg font-mono text-sm break-all">
                    <span className="flex-1">{newKey}</span>
                    <button
                      onClick={() => copyToClipboard(newKey, "new")}
                      className="p-2 hover:bg-gray-200 rounded"
                    >
                      {copiedId === "new" ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewKey(null);
                    }}
                    className="w-full mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Key Name
                  </label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g., Production API"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={createKey}
                      disabled={loading || !newKeyName.trim()}
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {loading ? "Creating..." : "Create"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Keys List */}
        {keys.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Key className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No API keys yet</p>
            <p className="text-sm">Create one to start using the API</p>
          </div>
        ) : (
          <div className="space-y-3">
            {keys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <div className="font-medium">{key.name}</div>
                  <div className="text-sm text-gray-500 font-mono">
                    {key.key_prefix}...
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Created {new Date(key.created_at).toLocaleDateString()}
                    {key.last_used_at && (
                      <> · Last used {new Date(key.last_used_at).toLocaleDateString()}</>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      key.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {key.is_active ? "Active" : "Inactive"}
                  </span>
                  <button
                    onClick={() => deleteKey(key.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* API Documentation Section */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">API Endpoints</h2>
        <p className="text-sm text-gray-600 mb-4">
          Base URL: <code className="bg-gray-100 px-2 py-1 rounded">https://allvideo.one</code>
        </p>

        <div className="space-y-3">
          {API_ENDPOINTS.map((endpoint, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
            >
              <span
                className={`px-2 py-1 text-xs font-medium rounded ${methodColor(
                  endpoint.method
                )}`}
              >
                {endpoint.method}
              </span>
              <div className="flex-1">
                <code className="text-sm font-mono">{endpoint.path}</code>
                <p className="text-sm text-gray-600 mt-1">{endpoint.description}</p>
              </div>
              {endpoint.auth && (
                <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded">
                  Auth Required
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Usage Example */}
        <div className="mt-6 p-4 bg-gray-900 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Example Request</span>
            <button
              onClick={() =>
                copyToClipboard(
                  `curl -X GET "https://allvideo.one/api/videos/VIDEO_ID/transcript" \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
                  "example"
                )
              }
              className="text-gray-400 hover:text-white"
            >
              {copiedId === "example" ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
          <pre className="text-green-400 text-sm overflow-x-auto">
{`curl -X GET "https://allvideo.one/api/videos/VIDEO_ID/transcript" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
          </pre>
        </div>

        {/* Response Example */}
        <div className="mt-4 p-4 bg-gray-900 rounded-lg">
          <span className="text-gray-400 text-sm">Example Response (Transcript)</span>
          <pre className="text-blue-400 text-sm mt-2 overflow-x-auto">
{`{
  "id": "video-uuid",
  "title": "My Video",
  "duration": 1800,
  "language": "en",
  "text": "Full transcript text here...",
  "segments": [
    { "start": 0.0, "end": 2.5, "text": "Welcome to..." },
    { "start": 2.5, "end": 5.0, "text": "In this video..." }
  ]
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
