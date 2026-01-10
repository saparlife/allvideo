"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ChevronRight, Video, Image, Music, FileText, Upload, List, Key, Zap } from "lucide-react";
import Link from "next/link";

// Method badge component
function MethodBadge({ method }: { method: "GET" | "POST" | "PATCH" | "DELETE" }) {
  const colors = {
    GET: "bg-emerald-500",
    POST: "bg-blue-500",
    PATCH: "bg-amber-500",
    DELETE: "bg-red-500",
  };
  return (
    <span className={`${colors[method]} text-white text-xs font-bold px-2 py-1 rounded font-mono`}>
      {method}
    </span>
  );
}

// Endpoint component
function Endpoint({
  method,
  path,
  description,
  request,
  response,
  params,
}: {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  description: string;
  request?: string;
  response: string;
  params?: { name: string; type: string; desc: string; required?: boolean }[];
}) {
  return (
    <AccordionItem value={`${method}-${path}`} className="border border-gray-200 rounded-lg mb-3 bg-white">
      <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 hover:no-underline">
        <div className="flex items-center gap-3 text-left">
          <MethodBadge method={method} />
          <code className="text-sm font-mono text-gray-700">{path}</code>
          <span className="text-sm text-gray-500 hidden sm:inline">— {description}</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4 pt-0">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">{description}</p>

          {params && params.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Parameters</h4>
              <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-left px-3 py-2 text-gray-600 font-medium">Name</th>
                      <th className="text-left px-3 py-2 text-gray-600 font-medium">Type</th>
                      <th className="text-left px-3 py-2 text-gray-600 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {params.map((p) => (
                      <tr key={p.name} className="border-t border-gray-200">
                        <td className="px-3 py-2">
                          <code className="text-indigo-600">{p.name}</code>
                          {p.required && <span className="text-red-500 ml-1">*</span>}
                        </td>
                        <td className="px-3 py-2 text-gray-500">{p.type}</td>
                        <td className="px-3 py-2 text-gray-600">{p.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {request && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Request</h4>
              <CodeBlock code={request} />
            </div>
          )}

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Response</h4>
            <CodeBlock code={response} language="json" />
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("getting-started");

  const sections = [
    { id: "getting-started", label: "Getting Started", icon: Zap },
    { id: "authentication", label: "Authentication", icon: Key },
    { id: "upload", label: "Upload", icon: Upload },
    { id: "videos", label: "Videos", icon: Video },
    { id: "images", label: "Images", icon: Image },
    { id: "audio", label: "Audio", icon: Music },
    { id: "files", label: "Files", icon: FileText },
    { id: "media", label: "Media List", icon: List },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">API Documentation</h1>
        <p className="text-gray-500">Complete reference for the 1stream API</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-56 flex-shrink-0 hidden lg:block">
          <nav className="space-y-1 sticky top-4">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                    activeSection === section.id
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {section.label}
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </button>
              );
            })}

            <div className="pt-4 mt-4 border-t border-gray-200">
              <Link
                href="/api-keys"
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-2 text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                <Key className="h-4 w-4" />
                Get API Key
              </Link>
            </div>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Mobile tabs */}
          <div className="flex gap-2 overflow-x-auto pb-4 lg:hidden">
            {sections.map((section) => (
              <Button
                key={section.id}
                variant={activeSection === section.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveSection(section.id)}
              >
                {section.label}
              </Button>
            ))}
          </div>

          {/* Getting Started */}
          {activeSection === "getting-started" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Getting Started</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Base URL</h3>
                    <code className="bg-gray-100 px-3 py-2 rounded-lg block text-sm">
                      https://stream.1app.to
                    </code>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Quick Example</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Upload any file with automatic type detection:
                    </p>
                    <CodeBlock code={`curl -X POST "https://stream.1app.to/api/v1/upload" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@video.mp4" \\
  -F "title=My Video" \\
  -F 'metadata={"projectId":"123"}'`} />
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Supported Media Types</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <Video className="h-5 w-5 text-blue-600 mb-1" />
                        <p className="font-medium text-sm">Videos</p>
                        <p className="text-xs text-gray-500">MP4, MOV, AVI, MKV</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                        <Image className="h-5 w-5 text-green-600 mb-1" />
                        <p className="font-medium text-sm">Images</p>
                        <p className="text-xs text-gray-500">JPG, PNG, WebP, GIF</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                        <Music className="h-5 w-5 text-purple-600 mb-1" />
                        <p className="font-medium text-sm">Audio</p>
                        <p className="text-xs text-gray-500">MP3, WAV, AAC, FLAC</p>
                      </div>
                      <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                        <FileText className="h-5 w-5 text-orange-600 mb-1" />
                        <p className="font-medium text-sm">Files</p>
                        <p className="text-xs text-gray-500">PDF, ZIP, any type</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Response Format</h3>
                    <p className="text-sm text-gray-600 mb-3">All responses are JSON:</p>
                    <CodeBlock code={`{
  "id": "med_abc123",
  "type": "video",
  "title": "My Video",
  "status": "processing",
  "metadata": {"projectId": "123"},
  "createdAt": "2024-01-15T10:30:00Z"
}`} language="json" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Authentication */}
          {activeSection === "authentication" && (
            <Card>
              <CardHeader>
                <CardTitle>Authentication</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-sm text-gray-600">
                  All API requests require authentication. You can use either the Authorization header or X-API-Key header.
                </p>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Bearer Token (Recommended)</h3>
                  <CodeBlock code={`curl "https://stream.1app.to/api/v1/media" \\
  -H "Authorization: Bearer YOUR_API_KEY"`} />
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">X-API-Key Header</h3>
                  <CodeBlock code={`curl "https://stream.1app.to/api/v1/media" \\
  -H "X-API-Key: YOUR_API_KEY"`} />
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>Security:</strong> Keep your API keys secure. Never expose them in client-side code or public repositories.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Error Response</h3>
                  <p className="text-sm text-gray-600 mb-3">Invalid or missing API key returns 401:</p>
                  <CodeBlock code={`{
  "error": "Unauthorized",
  "message": "Invalid API key"
}`} language="json" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upload */}
          {activeSection === "upload" && (
            <Card>
              <CardHeader>
                <CardTitle>Universal Upload</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="w-full">
                  <Endpoint
                    method="POST"
                    path="/api/v1/upload"
                    description="Upload any file with automatic type detection"
                    params={[
                      { name: "file", type: "File", desc: "The file to upload", required: true },
                      { name: "title", type: "string", desc: "Title for the media" },
                      { name: "metadata", type: "JSON", desc: "Custom metadata object (e.g., {\"projectId\": \"123\"})" },
                      { name: "public", type: "boolean", desc: "Make file publicly accessible (default: true)" },
                    ]}
                    request={`curl -X POST "https://stream.1app.to/api/v1/upload" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@video.mp4" \\
  -F "title=My Video" \\
  -F 'metadata={"projectId":"123","userId":"456"}'`}
                    response={`{
  "id": "med_abc123",
  "type": "video",
  "title": "My Video",
  "status": "processing",
  "size": 15728640,
  "mimeType": "video/mp4",
  "metadata": {
    "projectId": "123",
    "userId": "456"
  },
  "createdAt": "2024-01-15T10:30:00Z"
}`}
                  />
                </Accordion>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Tip:</strong> The upload endpoint automatically detects the file type and routes it to the appropriate processor. Videos get HLS transcoding, images get variant generation, etc.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Videos */}
          {activeSection === "videos" && (
            <Card>
              <CardHeader>
                <CardTitle>Videos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Videos are automatically transcoded to HLS format with multiple quality levels (360p, 480p, 720p, 1080p).
                </p>
                <Accordion type="multiple" className="w-full">
                  <Endpoint
                    method="POST"
                    path="/api/v1/videos"
                    description="Upload a video file for HLS transcoding"
                    params={[
                      { name: "file", type: "File", desc: "Video file (MP4, MOV, AVI, MKV, WebM)", required: true },
                      { name: "title", type: "string", desc: "Video title", required: true },
                      { name: "metadata", type: "JSON", desc: "Custom metadata" },
                    ]}
                    request={`curl -X POST "https://stream.1app.to/api/v1/videos" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@video.mp4" \\
  -F "title=My Video"`}
                    response={`{
  "id": "vid_abc123",
  "title": "My Video",
  "status": "processing",
  "size": 15728640,
  "createdAt": "2024-01-15T10:30:00Z"
}`}
                  />
                  <Endpoint
                    method="GET"
                    path="/api/v1/videos/:id"
                    description="Get video details including HLS streaming URL"
                    params={[
                      { name: "id", type: "string", desc: "Video ID", required: true },
                    ]}
                    request={`curl "https://stream.1app.to/api/v1/videos/vid_abc123" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
                    response={`{
  "id": "vid_abc123",
  "title": "My Video",
  "status": "ready",
  "hlsUrl": "https://cdn.1app.to/users/.../master.m3u8",
  "thumbnailUrl": "https://cdn.1app.to/users/.../thumb.jpg",
  "duration": 125.5,
  "width": 1920,
  "height": 1080,
  "size": 15728640,
  "qualities": ["360p", "480p", "720p", "1080p"],
  "metadata": {},
  "createdAt": "2024-01-15T10:30:00Z"
}`}
                  />
                  <Endpoint
                    method="PATCH"
                    path="/api/v1/videos/:id"
                    description="Update video title or metadata"
                    params={[
                      { name: "title", type: "string", desc: "New title" },
                      { name: "metadata", type: "JSON", desc: "Updated metadata (merged with existing)" },
                    ]}
                    request={`curl -X PATCH "https://stream.1app.to/api/v1/videos/vid_abc123" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"title":"New Title","metadata":{"category":"tutorials"}}'`}
                    response={`{
  "id": "vid_abc123",
  "title": "New Title",
  "metadata": {"category": "tutorials"},
  "updatedAt": "2024-01-15T11:00:00Z"
}`}
                  />
                  <Endpoint
                    method="DELETE"
                    path="/api/v1/videos/:id"
                    description="Delete a video and all associated files"
                    params={[
                      { name: "id", type: "string", desc: "Video ID", required: true },
                    ]}
                    request={`curl -X DELETE "https://stream.1app.to/api/v1/videos/vid_abc123" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
                    response={`{
  "deleted": true,
  "id": "vid_abc123"
}`}
                  />
                </Accordion>

                <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Video Status</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li><code className="bg-gray-200 px-1 rounded">uploading</code> - File is being uploaded</li>
                    <li><code className="bg-gray-200 px-1 rounded">processing</code> - Transcoding in progress</li>
                    <li><code className="bg-gray-200 px-1 rounded">ready</code> - Video is ready for streaming</li>
                    <li><code className="bg-gray-200 px-1 rounded">failed</code> - Processing failed</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Images */}
          {activeSection === "images" && (
            <Card>
              <CardHeader>
                <CardTitle>Images</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Images are automatically processed with variant generation. Use presets for common use cases.
                </p>
                <Accordion type="multiple" className="w-full">
                  <Endpoint
                    method="POST"
                    path="/api/v1/images"
                    description="Upload and process an image with automatic variants"
                    params={[
                      { name: "file", type: "File", desc: "Image file (JPG, PNG, WebP, GIF, AVIF)", required: true },
                      { name: "title", type: "string", desc: "Image title" },
                      { name: "preset", type: "string", desc: "Processing preset: avatar, product, banner" },
                      { name: "format", type: "string", desc: "Output format: webp, jpeg, png, avif" },
                      { name: "metadata", type: "JSON", desc: "Custom metadata" },
                    ]}
                    request={`curl -X POST "https://stream.1app.to/api/v1/images" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@photo.jpg" \\
  -F "title=Profile Photo" \\
  -F "preset=avatar"`}
                    response={`{
  "id": "img_abc123",
  "title": "Profile Photo",
  "status": "ready",
  "url": "https://cdn.1app.to/users/.../original.webp",
  "variants": {
    "thumbnail": "https://cdn.1app.to/users/.../thumb.webp",
    "small": "https://cdn.1app.to/users/.../small.webp",
    "medium": "https://cdn.1app.to/users/.../medium.webp",
    "large": "https://cdn.1app.to/users/.../large.webp"
  },
  "width": 1200,
  "height": 800,
  "dominantColor": "#4a90d9",
  "size": 245760,
  "createdAt": "2024-01-15T10:30:00Z"
}`}
                  />
                  <Endpoint
                    method="GET"
                    path="/api/v1/images/:id"
                    description="Get image details and variant URLs"
                    params={[
                      { name: "id", type: "string", desc: "Image ID", required: true },
                    ]}
                    request={`curl "https://stream.1app.to/api/v1/images/img_abc123" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
                    response={`{
  "id": "img_abc123",
  "title": "Profile Photo",
  "status": "ready",
  "url": "https://cdn.1app.to/users/.../original.webp",
  "variants": {
    "thumbnail": "https://cdn...",
    "small": "https://cdn...",
    "medium": "https://cdn...",
    "large": "https://cdn..."
  },
  "width": 1200,
  "height": 800,
  "dominantColor": "#4a90d9",
  "metadata": {},
  "createdAt": "2024-01-15T10:30:00Z"
}`}
                  />
                  <Endpoint
                    method="DELETE"
                    path="/api/v1/images/:id"
                    description="Delete an image and all variants"
                    params={[
                      { name: "id", type: "string", desc: "Image ID", required: true },
                    ]}
                    request={`curl -X DELETE "https://stream.1app.to/api/v1/images/img_abc123" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
                    response={`{"deleted": true, "id": "img_abc123"}`}
                  />
                </Accordion>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">avatar</h4>
                    <p className="text-sm text-gray-600">Square crop: 150x150, 300x300</p>
                  </div>
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">product</h4>
                    <p className="text-sm text-gray-600">Product images: 400x400, 800x800</p>
                  </div>
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">banner</h4>
                    <p className="text-sm text-gray-600">Wide format: 1200x400, 2400x800</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Audio */}
          {activeSection === "audio" && (
            <Card>
              <CardHeader>
                <CardTitle>Audio</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Store and serve audio files with metadata extraction.
                </p>
                <Accordion type="multiple" className="w-full">
                  <Endpoint
                    method="POST"
                    path="/api/v1/audio"
                    description="Upload an audio file"
                    params={[
                      { name: "file", type: "File", desc: "Audio file (MP3, WAV, AAC, FLAC, OGG)", required: true },
                      { name: "title", type: "string", desc: "Audio title" },
                      { name: "metadata", type: "JSON", desc: "Custom metadata" },
                    ]}
                    request={`curl -X POST "https://stream.1app.to/api/v1/audio" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@podcast.mp3" \\
  -F "title=Episode 1"`}
                    response={`{
  "id": "aud_abc123",
  "title": "Episode 1",
  "status": "ready",
  "url": "https://cdn.1app.to/users/.../audio.mp3",
  "duration": 1823.5,
  "size": 29360128,
  "mimeType": "audio/mpeg",
  "metadata": {},
  "createdAt": "2024-01-15T10:30:00Z"
}`}
                  />
                  <Endpoint
                    method="GET"
                    path="/api/v1/audio/:id"
                    description="Get audio details"
                    params={[
                      { name: "id", type: "string", desc: "Audio ID", required: true },
                    ]}
                    request={`curl "https://stream.1app.to/api/v1/audio/aud_abc123" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
                    response={`{
  "id": "aud_abc123",
  "title": "Episode 1",
  "status": "ready",
  "url": "https://cdn.1app.to/users/.../audio.mp3",
  "duration": 1823.5,
  "size": 29360128,
  "metadata": {},
  "createdAt": "2024-01-15T10:30:00Z"
}`}
                  />
                  <Endpoint
                    method="DELETE"
                    path="/api/v1/audio/:id"
                    description="Delete an audio file"
                    params={[
                      { name: "id", type: "string", desc: "Audio ID", required: true },
                    ]}
                    request={`curl -X DELETE "https://stream.1app.to/api/v1/audio/aud_abc123" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
                    response={`{"deleted": true, "id": "aud_abc123"}`}
                  />
                </Accordion>
              </CardContent>
            </Card>
          )}

          {/* Files */}
          {activeSection === "files" && (
            <Card>
              <CardHeader>
                <CardTitle>Files</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Store any file type with public or private access. Private files use signed URLs for secure access.
                </p>
                <Accordion type="multiple" className="w-full">
                  <Endpoint
                    method="POST"
                    path="/api/v1/files"
                    description="Upload any file with optional public/private access"
                    params={[
                      { name: "file", type: "File", desc: "Any file type", required: true },
                      { name: "title", type: "string", desc: "File title" },
                      { name: "public", type: "boolean", desc: "Public access (default: true)" },
                      { name: "metadata", type: "JSON", desc: "Custom metadata" },
                    ]}
                    request={`curl -X POST "https://stream.1app.to/api/v1/files" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@document.pdf" \\
  -F "title=Report Q4" \\
  -F "public=false"`}
                    response={`{
  "id": "file_abc123",
  "title": "Report Q4",
  "status": "ready",
  "filename": "document.pdf",
  "size": 1048576,
  "mimeType": "application/pdf",
  "public": false,
  "createdAt": "2024-01-15T10:30:00Z"
}`}
                  />
                  <Endpoint
                    method="GET"
                    path="/api/v1/files/:id"
                    description="Get file details. Add ?download=true for signed download URL"
                    params={[
                      { name: "download", type: "boolean", desc: "Generate signed download URL (query param)" },
                      { name: "expires", type: "number", desc: "URL expiration in seconds, default: 3600 (query param)" },
                    ]}
                    request={`# Get file info
curl "https://stream.1app.to/api/v1/files/file_abc123" \\
  -H "Authorization: Bearer YOUR_API_KEY"

# Get with signed download URL
curl "https://stream.1app.to/api/v1/files/file_abc123?download=true&expires=3600" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
                    response={`{
  "id": "file_abc123",
  "title": "Report Q4",
  "filename": "document.pdf",
  "size": 1048576,
  "public": false,
  "url": null,
  "signedUrl": "https://cdn...?X-Amz-Signature=...",
  "downloadUrl": "https://cdn...?X-Amz-Signature=...",
  "metadata": {},
  "createdAt": "2024-01-15T10:30:00Z"
}`}
                  />
                  <Endpoint
                    method="DELETE"
                    path="/api/v1/files/:id"
                    description="Delete a file"
                    params={[
                      { name: "id", type: "string", desc: "File ID", required: true },
                    ]}
                    request={`curl -X DELETE "https://stream.1app.to/api/v1/files/file_abc123" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
                    response={`{"deleted": true, "id": "file_abc123"}`}
                  />
                </Accordion>

                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>Private files:</strong> When <code>public=false</code>, files are not directly accessible. Use the <code>?download=true</code> parameter to get a time-limited signed URL.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Media List */}
          {activeSection === "media" && (
            <Card>
              <CardHeader>
                <CardTitle>Media List</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  List and filter all your media across types. Query by custom metadata fields.
                </p>
                <Accordion type="multiple" className="w-full">
                  <Endpoint
                    method="GET"
                    path="/api/v1/media"
                    description="List all media with filtering and pagination"
                    params={[
                      { name: "type", type: "string", desc: "Filter by type: video, image, audio, file" },
                      { name: "status", type: "string", desc: "Filter by status: ready, processing, failed" },
                      { name: "limit", type: "number", desc: "Items per page (default: 20, max: 100)" },
                      { name: "offset", type: "number", desc: "Pagination offset" },
                      { name: "*", type: "string", desc: "Any custom metadata field (e.g., projectId=123)" },
                    ]}
                    request={`# List all media
curl "https://stream.1app.to/api/v1/media" \\
  -H "Authorization: Bearer YOUR_API_KEY"

# Filter by type
curl "https://stream.1app.to/api/v1/media?type=video" \\
  -H "Authorization: Bearer YOUR_API_KEY"

# Filter by custom metadata
curl "https://stream.1app.to/api/v1/media?projectId=123&userId=456" \\
  -H "Authorization: Bearer YOUR_API_KEY"

# Pagination
curl "https://stream.1app.to/api/v1/media?limit=10&offset=20" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
                    response={`{
  "items": [
    {
      "id": "vid_abc123",
      "type": "video",
      "title": "My Video",
      "status": "ready",
      "thumbnailUrl": "https://cdn...",
      "size": 15728640,
      "metadata": {"projectId": "123"},
      "createdAt": "2024-01-15T10:30:00Z"
    },
    {
      "id": "img_def456",
      "type": "image",
      "title": "Photo",
      "status": "ready",
      "url": "https://cdn...",
      "size": 245760,
      "metadata": {"projectId": "123"},
      "createdAt": "2024-01-14T09:00:00Z"
    }
  ],
  "total": 42,
  "limit": 20,
  "offset": 0
}`}
                  />
                </Accordion>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Custom Metadata Filtering</h4>
                  <p className="text-sm text-blue-800">
                    You can filter by any custom metadata field. For example, if you stored <code>{`{"companyId": "comp_123", "userId": "user_456"}`}</code> when uploading, you can query with <code>?companyId=comp_123&userId=user_456</code>.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
