"use client";

import { useState } from "react";
import { Share2, Link as LinkIcon, Code, Copy, Check, X } from "lucide-react";

interface PlaylistShareButtonProps {
  playlistId: string;
  playlistTitle: string;
}

export function PlaylistShareButton({ playlistId, playlistTitle }: PlaylistShareButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [embedSize, setEmbedSize] = useState<"small" | "medium" | "large">("medium");

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const playlistUrl = `${baseUrl}/playlist/${playlistId}`;

  const embedSizes = {
    small: { width: 560, height: 315 },
    medium: { width: 720, height: 405 },
    large: { width: 960, height: 540 },
  };

  const { width, height } = embedSizes[embedSize];
  const embedCode = `<iframe width="${width}" height="${height}" src="${baseUrl}/embed/playlist/${playlistId}" title="${playlistTitle}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;

  const copyToClipboard = async (text: string, type: "link" | "embed") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "link") {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } else {
        setCopiedEmbed(true);
        setTimeout(() => setCopiedEmbed(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm font-medium transition-colors"
      >
        <Share2 className="w-4 h-4" />
        Share
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Share Playlist</h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-6">
              {/* Link Section */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <LinkIcon className="w-4 h-4" />
                  Playlist Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={playlistUrl}
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 select-all"
                  />
                  <button
                    onClick={() => copyToClipboard(playlistUrl, "link")}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Embed Section */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Code className="w-4 h-4" />
                  Embed Code
                </label>

                {/* Size selector */}
                <div className="flex gap-2 mb-3">
                  {(["small", "medium", "large"] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => setEmbedSize(size)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                        embedSize === size
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {size.charAt(0).toUpperCase() + size.slice(1)} ({embedSizes[size].width}x{embedSizes[size].height})
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <textarea
                    readOnly
                    value={embedCode}
                    rows={4}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 font-mono resize-none"
                  />
                  <button
                    onClick={() => copyToClipboard(embedCode, "embed")}
                    className="absolute bottom-2 right-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-900 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    {copiedEmbed ? (
                      <>
                        <Check className="w-3 h-3" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Preview */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Preview</p>
                <div className="bg-gray-100 rounded-lg p-4 overflow-hidden">
                  <div
                    className="mx-auto bg-black rounded"
                    style={{
                      width: "100%",
                      maxWidth: width,
                      aspectRatio: `${width}/${height}`,
                    }}
                  >
                    <iframe
                      src={`${baseUrl}/embed/playlist/${playlistId}`}
                      title={playlistTitle}
                      className="w-full h-full rounded"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
