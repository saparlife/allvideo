"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

type UploadState = "idle" | "uploading" | "processing" | "ready" | "error";

export default function StudioUploadPage() {
  const router = useRouter();
  const t = useTranslations("studio");
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("public");

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("video/")) {
      handleUpload(file);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleUpload = async (file: File) => {
    setTitle(file.name.replace(/\.[^/.]+$/, ""));
    setState("uploading");
    setError(null);
    setProgress(0);

    try {
      // Initialize upload
      const videoTitle = file.name.replace(/\.[^/.]+$/, "");
      const initResponse = await fetch("/api/videos/upload/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          size: file.size,
          title: videoTitle,
        }),
      });

      if (!initResponse.ok) {
        const errorData = await initResponse.json();
        throw new Error(errorData.error || "Failed to initialize upload");
      }

      const { videoId: newVideoId, uploadId, key, parts, chunkSize } = await initResponse.json();
      setVideoId(newVideoId);

      // Upload file in chunks (multipart upload)
      const uploadedParts: { partNumber: number; etag: string }[] = [];
      let uploadedBytes = 0;

      for (const part of parts) {
        const start = (part.partNumber - 1) * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);

        const response = await fetch(part.uploadUrl, {
          method: "PUT",
          body: chunk,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload part ${part.partNumber}`);
        }

        const etag = response.headers.get("ETag") || `"part-${part.partNumber}"`;
        uploadedParts.push({ partNumber: part.partNumber, etag });

        uploadedBytes += chunk.size;
        setProgress(Math.round((uploadedBytes / file.size) * 100));
      }

      setState("processing");

      // Complete multipart upload
      const completeResponse = await fetch("/api/videos/upload/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: newVideoId,
          uploadId,
          key,
          parts: uploadedParts,
          title: title || file.name.replace(/\.[^/.]+$/, ""),
          description,
          visibility,
        }),
      });

      if (!completeResponse.ok) {
        const errorData = await completeResponse.json();
        throw new Error(errorData.error || "Failed to complete upload");
      }

      setState("ready");

      // Redirect to video edit page after a short delay
      setTimeout(() => {
        router.push(`/studio/videos/${newVideoId}`);
      }, 2000);
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Upload failed");
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t("upload")}</h1>

      {state === "idle" && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
            isDragging
              ? "border-indigo-500 bg-indigo-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
        >
          <input
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                {t("uploadDragDrop")}
              </p>
              <p className="text-gray-500 mt-1">{t("uploadBrowse")}</p>
            </div>
            <p className="text-sm text-gray-400">
              MP4, WebM, MOV up to 10GB
            </p>
          </div>
        </div>
      )}

      {state === "uploading" && (
        <div className="bg-white rounded-xl border p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-indigo-600 animate-pulse"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-900">{t("uploadProgress")}</p>
            <p className="text-3xl font-bold text-indigo-600 mt-2">{progress}%</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {state === "processing" && (
        <div className="bg-white rounded-xl border p-8 text-center">
          <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-yellow-600 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-900">{t("processing")}</p>
          <p className="text-gray-500 mt-1">
            Your video is being processed. This may take a few minutes.
          </p>
        </div>
      )}

      {state === "ready" && (
        <div className="bg-white rounded-xl border p-8 text-center">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-900">{t("ready")}</p>
          <p className="text-gray-500 mt-1">
            Your video has been uploaded successfully!
          </p>
        </div>
      )}

      {state === "error" && (
        <div className="bg-white rounded-xl border p-8 text-center">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-900">Upload failed</p>
          <p className="text-red-600 mt-1">{error}</p>
          <button
            onClick={() => setState("idle")}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
