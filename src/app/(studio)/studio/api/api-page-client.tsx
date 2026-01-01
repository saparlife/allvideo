"use client";

import { useState } from "react";
import { Key, Plus, Copy, Trash2, Check, ChevronDown, ChevronRight } from "lucide-react";

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

interface EndpointGroup {
  title: string;
  description: string;
  auth: "api-key" | "none" | "cookie";
  endpoints: Endpoint[];
}

interface Endpoint {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  description: string;
  params?: { name: string; type: string; required: boolean; description: string }[];
  body?: { name: string; type: string; required: boolean; description: string }[];
  response: string;
  example?: { request?: string; response: string };
}

const API_GROUPS: EndpointGroup[] = [
  {
    title: "Developer API",
    description: "Programmatic access to manage your videos. Requires API key with X-API-Key header.",
    auth: "api-key",
    endpoints: [
      {
        method: "GET",
        path: "/api/public/videos",
        description: "List all your videos",
        response: `{
  "videos": [{
    "id": "uuid",
    "title": "Video Title",
    "status": "ready",
    "duration": 120,
    "thumbnail": "https://cdn.lovsell.com/...",
    "hls": "https://cdn.lovsell.com/.../master.m3u8",
    "embed": "https://video.lovsell.com/embed/uuid",
    "createdAt": "2024-01-01T00:00:00Z"
  }]
}`,
        example: {
          request: `curl -X GET "https://video.lovsell.com/api/public/videos" \\
  -H "X-API-Key: av_your_api_key"`,
          response: `{"videos": [{"id": "abc123", "title": "My Video", "status": "ready", ...}]}`
        }
      },
      {
        method: "POST",
        path: "/api/public/videos",
        description: "Initialize video upload. Returns presigned URL for direct upload to storage.",
        body: [
          { name: "title", type: "string", required: true, description: "Video title" },
          { name: "filename", type: "string", required: true, description: "Original filename" },
          { name: "size", type: "number", required: true, description: "File size in bytes" },
        ],
        response: `{
  "id": "uuid",
  "uploadUrl": "https://...presigned-url...",
  "expiresIn": 3600
}`,
        example: {
          request: `curl -X POST "https://video.lovsell.com/api/public/videos" \\
  -H "X-API-Key: av_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{"title": "My Video", "filename": "video.mp4", "size": 104857600}'`,
          response: `{"id": "abc123", "uploadUrl": "https://...", "expiresIn": 3600}`
        }
      },
      {
        method: "POST",
        path: "/api/public/videos/:id/complete",
        description: "Confirm upload completed and start transcoding",
        response: `{
  "id": "uuid",
  "status": "processing",
  "message": "Video queued for transcoding"
}`,
        example: {
          request: `# After uploading to presigned URL:
curl -X POST "https://video.lovsell.com/api/public/videos/abc123/complete" \\
  -H "X-API-Key: av_your_api_key"`,
          response: `{"id": "abc123", "status": "processing", "message": "Video queued for transcoding"}`
        }
      },
      {
        method: "GET",
        path: "/api/public/videos/:id",
        description: "Get video details including URLs",
        response: `{
  "id": "uuid",
  "title": "Video Title",
  "status": "ready",
  "duration": 120,
  "thumbnail": "https://cdn.lovsell.com/...",
  "hls": "https://cdn.lovsell.com/.../master.m3u8",
  "embed": "https://video.lovsell.com/embed/uuid",
  "createdAt": "2024-01-01T00:00:00Z"
}`,
        example: {
          request: `curl -X GET "https://video.lovsell.com/api/public/videos/abc123" \\
  -H "X-API-Key: av_your_api_key"`,
          response: `{"id": "abc123", "title": "My Video", "status": "ready", "hls": "https://...", ...}`
        }
      },
      {
        method: "DELETE",
        path: "/api/public/videos/:id",
        description: "Delete video and all associated files",
        response: `{"success": true}`,
        example: {
          request: `curl -X DELETE "https://video.lovsell.com/api/public/videos/abc123" \\
  -H "X-API-Key: av_your_api_key"`,
          response: `{"success": true}`
        }
      },
    ],
  },
  {
    title: "Public Videos",
    description: "Access public video listings. No authentication required.",
    auth: "none",
    endpoints: [
      {
        method: "GET",
        path: "/api/videos/public",
        description: "Get list of public videos with pagination and filters",
        params: [
          { name: "page", type: "number", required: false, description: "Page number (default: 0)" },
          { name: "limit", type: "number", required: false, description: "Videos per page (default: 12)" },
          { name: "category", type: "string", required: false, description: "Filter by category slug" },
          { name: "sort", type: "string", required: false, description: "Sort: recent, popular, trending" },
        ],
        response: `{
  "videos": [{
    "id": "uuid",
    "title": "Video Title",
    "slug": "video-slug",
    "thumbnail_url": "https://...",
    "duration": 120,
    "views_count": 1000,
    "likes_count": 50,
    "created_at": "2024-01-01T00:00:00Z",
    "user": {
      "id": "uuid",
      "username": "creator",
      "avatar_url": "https://..."
    }
  }],
  "hasMore": true,
  "page": 0,
  "limit": 12
}`,
        example: {
          request: `curl "https://video.lovsell.com/api/videos/public?limit=10&sort=popular"`,
          response: `{"videos": [...], "hasMore": true, "page": 0, "limit": 10}`
        }
      },
    ],
  },
  {
    title: "Transcripts",
    description: "Access video transcripts with timestamps. Public videos accessible without auth.",
    auth: "none",
    endpoints: [
      {
        method: "GET",
        path: "/api/videos/:id/transcript",
        description: "Get full transcript with word-level timestamps",
        response: `{
  "id": "uuid",
  "title": "Video Title",
  "duration": 1800,
  "language": "en",
  "text": "Full transcript text here...",
  "segments": [
    {"start": 0.0, "end": 2.5, "text": "Welcome to..."},
    {"start": 2.5, "end": 5.0, "text": "In this video..."}
  ],
  "vtt": "WEBVTT\\n\\n1\\n00:00:00.000 --> 00:00:02.500\\nWelcome to..."
}`,
        example: {
          request: `curl "https://video.lovsell.com/api/videos/abc123/transcript"`,
          response: `{
  "id": "abc123",
  "title": "My Video",
  "duration": 600,
  "language": "en",
  "text": "Hello and welcome to this tutorial...",
  "segments": [
    {"start": 0.0, "end": 1.5, "text": "Hello and welcome"},
    {"start": 1.5, "end": 3.2, "text": "to this tutorial"}
  ]
}`
        }
      },
      {
        method: "GET",
        path: "/api/videos/:id/subtitles",
        description: "Get VTT subtitle file for video player integration",
        response: `WEBVTT

1
00:00:00.000 --> 00:00:02.500
Welcome to...

2
00:00:02.500 --> 00:00:05.000
In this video...`,
        example: {
          request: `curl "https://video.lovsell.com/api/videos/abc123/subtitles"`,
          response: `WEBVTT

1
00:00:00.000 --> 00:00:01.500
Hello and welcome

2
00:00:01.500 --> 00:00:03.200
to this tutorial`
        }
      },
    ],
  },
  {
    title: "Comments",
    description: "Video comments. GET is public, POST requires authentication.",
    auth: "cookie",
    endpoints: [
      {
        method: "GET",
        path: "/api/videos/:id/comments",
        description: "Get video comments with replies",
        params: [
          { name: "sort", type: "string", required: false, description: "Sort: newest, top" },
        ],
        response: `{
  "comments": [{
    "id": "uuid",
    "content": "Great video!",
    "created_at": "2024-01-01T00:00:00Z",
    "likes_count": 5,
    "user": {
      "id": "uuid",
      "username": "user1",
      "avatar_url": "https://..."
    },
    "replies": [...]
  }]
}`,
        example: {
          request: `curl "https://video.lovsell.com/api/videos/abc123/comments?sort=top"`,
          response: `{"comments": [{"id": "...", "content": "Great video!", "likes_count": 5, ...}]}`
        }
      },
      {
        method: "POST",
        path: "/api/videos/:id/comments",
        description: "Add a comment (requires login)",
        body: [
          { name: "content", type: "string", required: true, description: "Comment text (max 2000 chars)" },
          { name: "parent_id", type: "string", required: false, description: "Parent comment ID for replies" },
        ],
        response: `{
  "comment": {
    "id": "uuid",
    "content": "Great video!",
    "created_at": "2024-01-01T00:00:00Z",
    "likes_count": 0,
    "user": {...}
  }
}`,
        example: {
          request: `curl -X POST "https://video.lovsell.com/api/videos/abc123/comments" \\
  -H "Content-Type: application/json" \\
  -H "Cookie: sb-access-token=..." \\
  -d '{"content": "Great video!"}'`,
          response: `{"comment": {"id": "...", "content": "Great video!", ...}}`
        }
      },
    ],
  },
];

export function ApiPageClient({ initialKeys }: ApiPageClientProps) {
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyPermissions, setNewKeyPermissions] = useState({ read: true, write: true, delete: false });
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ "Developer API": true });
  const [expandedEndpoints, setExpandedEndpoints] = useState<Record<string, boolean>>({});

  const createKey = async () => {
    if (!newKeyName.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newKeyName,
          permissions: newKeyPermissions,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setNewKey(data.key);
        setKeys([data.apiKey, ...keys]);
        setNewKeyName("");
        setNewKeyPermissions({ read: true, write: true, delete: false });
      }
    } catch (err) {
      console.error("Error creating key:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteKey = async (id: string) => {
    if (!confirm("Delete this API key? This cannot be undone.")) return;

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
      case "GET": return "bg-emerald-500 text-white";
      case "POST": return "bg-blue-500 text-white";
      case "PATCH": return "bg-amber-500 text-white";
      case "DELETE": return "bg-red-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const authBadge = (auth: string) => {
    switch (auth) {
      case "api-key": return <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">API Key</span>;
      case "cookie": return <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">Session</span>;
      case "none": return <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">Public</span>;
    }
  };

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const toggleEndpoint = (key: string) => {
    setExpandedEndpoints(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">API Documentation</h1>
        <p className="text-gray-600 mt-1">
          Integrate AllVideo with your applications
        </p>
      </div>

      {/* Quick Start */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 mb-8 text-white">
        <h2 className="text-lg font-semibold mb-2">Quick Start</h2>
        <p className="text-indigo-100 mb-4">Upload your first video via API in 3 steps:</p>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="font-mono text-indigo-200 mb-1">1. Initialize Upload</div>
            <code className="text-xs">POST /api/public/videos</code>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="font-mono text-indigo-200 mb-1">2. Upload to URL</div>
            <code className="text-xs">PUT uploadUrl (from step 1)</code>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="font-mono text-indigo-200 mb-1">3. Confirm Complete</div>
            <code className="text-xs">POST /api/public/videos/:id/complete</code>
          </div>
        </div>
      </div>

      {/* API Keys Section */}
      <div className="bg-white rounded-lg border p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Key className="w-5 h-5" />
              API Keys
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Use with <code className="bg-gray-100 px-1 rounded">X-API-Key</code> header
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Key
          </button>
        </div>

        {/* Create Key Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Create API Key</h3>

              {newKey ? (
                <div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-amber-800">
                      Save this key now. You won't be able to see it again!
                    </p>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg font-mono text-sm break-all">
                    <span className="flex-1 select-all">{newKey}</span>
                    <button
                      onClick={() => copyToClipboard(newKey, "new")}
                      className="p-2 hover:bg-gray-200 rounded flex-shrink-0"
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
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Key Name
                    </label>
                    <input
                      type="text"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="e.g., Production, Development"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Permissions
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newKeyPermissions.read}
                          onChange={(e) => setNewKeyPermissions(p => ({ ...p, read: e.target.checked }))}
                          className="rounded"
                        />
                        <span className="text-sm">Read</span>
                        <span className="text-xs text-gray-500">- List and get videos</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newKeyPermissions.write}
                          onChange={(e) => setNewKeyPermissions(p => ({ ...p, write: e.target.checked }))}
                          className="rounded"
                        />
                        <span className="text-sm">Write</span>
                        <span className="text-xs text-gray-500">- Upload videos</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newKeyPermissions.delete}
                          onChange={(e) => setNewKeyPermissions(p => ({ ...p, delete: e.target.checked }))}
                          className="rounded"
                        />
                        <span className="text-sm">Delete</span>
                        <span className="text-xs text-gray-500">- Delete videos</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-3">
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
          <div className="space-y-2">
            {keys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{key.name}</span>
                    <span className={`px-1.5 py-0.5 text-xs rounded ${key.is_active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}>
                      {key.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                    <code className="bg-gray-200 px-1.5 py-0.5 rounded text-xs">{key.key_prefix}...</code>
                    <span>
                      {[
                        key.permissions.read && "read",
                        key.permissions.write && "write",
                        key.permissions.delete && "delete"
                      ].filter(Boolean).join(", ")}
                    </span>
                    {key.last_used_at && (
                      <span>Last used: {new Date(key.last_used_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteKey(key.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* API Reference */}
      <div className="bg-white rounded-lg border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">API Reference</h2>
          <p className="text-sm text-gray-500 mt-1">
            Base URL: <code className="bg-gray-100 px-2 py-0.5 rounded">https://video.lovsell.com</code>
          </p>
        </div>

        {API_GROUPS.map((group) => (
          <div key={group.title} className="border-b last:border-b-0">
            <button
              onClick={() => toggleGroup(group.title)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 text-left"
            >
              <div className="flex items-center gap-3">
                {expandedGroups[group.title] ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{group.title}</span>
                    {authBadge(group.auth)}
                  </div>
                  <p className="text-sm text-gray-500">{group.description}</p>
                </div>
              </div>
              <span className="text-sm text-gray-400">{group.endpoints.length} endpoints</span>
            </button>

            {expandedGroups[group.title] && (
              <div className="px-4 pb-4">
                {group.endpoints.map((endpoint, idx) => {
                  const endpointKey = `${group.title}-${idx}`;
                  const isExpanded = expandedEndpoints[endpointKey];

                  return (
                    <div key={idx} className="border rounded-lg mb-2 last:mb-0 overflow-hidden">
                      <button
                        onClick={() => toggleEndpoint(endpointKey)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 text-left"
                      >
                        <span className={`px-2 py-1 text-xs font-bold rounded ${methodColor(endpoint.method)}`}>
                          {endpoint.method}
                        </span>
                        <code className="text-sm font-mono flex-1">{endpoint.path}</code>
                        <span className="text-sm text-gray-500">{endpoint.description}</span>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="border-t bg-gray-50 p-4 space-y-4">
                          {/* Parameters */}
                          {endpoint.params && endpoint.params.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium mb-2">Query Parameters</h4>
                              <div className="bg-white rounded border divide-y">
                                {endpoint.params.map((param, i) => (
                                  <div key={i} className="flex items-start gap-3 p-2 text-sm">
                                    <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{param.name}</code>
                                    <span className="text-gray-500">{param.type}</span>
                                    {param.required && <span className="text-red-500 text-xs">required</span>}
                                    <span className="text-gray-600 flex-1">{param.description}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Body */}
                          {endpoint.body && endpoint.body.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium mb-2">Request Body</h4>
                              <div className="bg-white rounded border divide-y">
                                {endpoint.body.map((param, i) => (
                                  <div key={i} className="flex items-start gap-3 p-2 text-sm">
                                    <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{param.name}</code>
                                    <span className="text-gray-500">{param.type}</span>
                                    {param.required && <span className="text-red-500 text-xs">required</span>}
                                    <span className="text-gray-600 flex-1">{param.description}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Response */}
                          <div>
                            <h4 className="text-sm font-medium mb-2">Response</h4>
                            <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                              {endpoint.response}
                            </pre>
                          </div>

                          {/* Example */}
                          {endpoint.example && (
                            <div>
                              <h4 className="text-sm font-medium mb-2">Example</h4>
                              <div className="space-y-2">
                                {endpoint.example.request && (
                                  <div className="relative">
                                    <button
                                      onClick={() => copyToClipboard(endpoint.example!.request!, `example-${endpointKey}`)}
                                      className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 rounded"
                                    >
                                      {copiedId === `example-${endpointKey}` ? (
                                        <Check className="w-3 h-3 text-green-400" />
                                      ) : (
                                        <Copy className="w-3 h-3 text-gray-300" />
                                      )}
                                    </button>
                                    <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto">
                                      {endpoint.example.request}
                                    </pre>
                                  </div>
                                )}
                                <pre className="bg-gray-800 text-blue-300 p-3 rounded text-xs overflow-x-auto">
                                  {endpoint.example.response}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Rate Limits */}
      <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="font-medium text-amber-800 mb-2">Rate Limits</h3>
        <p className="text-sm text-amber-700">
          Default: 60 requests per minute per API key. Contact us for higher limits.
        </p>
      </div>
    </div>
  );
}
