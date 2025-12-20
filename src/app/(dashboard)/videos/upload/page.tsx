"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Upload, X, Video, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type UploadStatus = "idle" | "uploading" | "processing" | "complete" | "error";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.startsWith("video/")) {
        setFile(droppedFile);
        if (!title) {
          setTitle(droppedFile.name.replace(/\.[^/.]+$/, ""));
        }
      } else {
        toast.error("Please upload a video file");
      }
    }
  }, [title]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !title) {
      toast.error("Please select a file and enter a title");
      return;
    }

    setStatus("uploading");
    setUploadProgress(0);
    setErrorMessage("");

    try {
      // Step 1: Initialize upload
      const initResponse = await fetch("/api/videos/upload/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          size: file.size,
          contentType: file.type,
          title,
        }),
      });

      if (!initResponse.ok) {
        const error = await initResponse.json();
        throw new Error(error.error || "Failed to initialize upload");
      }

      const { videoId, uploadUrl } = await initResponse.json();

      // Step 2: Upload file directly to R2 (or via API for chunked)
      // For simplicity, using direct upload for smaller files
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file");
      }

      setUploadProgress(100);
      setStatus("processing");

      // Step 3: Complete upload and trigger transcoding
      const completeResponse = await fetch("/api/videos/upload/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
      });

      if (!completeResponse.ok) {
        throw new Error("Failed to complete upload");
      }

      setStatus("complete");
      toast.success("Video uploaded successfully! Processing will begin shortly.");

      setTimeout(() => {
        router.push("/videos");
      }, 2000);
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Upload failed");
      toast.error("Upload failed. Please try again.");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Upload Video</h1>
        <p className="text-gray-400">
          Upload a video file to your library
        </p>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Video File</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drop Zone */}
          {!file ? (
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                dragActive
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-gray-700 hover:border-gray-600"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 mx-auto text-gray-500 mb-4" />
              <p className="text-lg font-medium text-white mb-2">
                Drop your video here
              </p>
              <p className="text-sm text-gray-400 mb-4">
                or click to browse
              </p>
              <Input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <Button asChild variant="outline">
                <label htmlFor="file-upload" className="cursor-pointer">
                  Select File
                </label>
              </Button>
              <p className="text-xs text-gray-500 mt-4">
                Supported formats: MP4, MOV, AVI, MKV, WMV (max 2GB)
              </p>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                  <Video className="h-6 w-6 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{file.name}</p>
                  <p className="text-sm text-gray-400">{formatFileSize(file.size)}</p>
                </div>
                {status === "idle" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setFile(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Progress */}
              {(status === "uploading" || status === "processing") && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">
                      {status === "uploading" ? "Uploading..." : "Processing..."}
                    </span>
                    <span className="text-white">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              {/* Complete */}
              {status === "complete" && (
                <div className="mt-4 flex items-center gap-2 text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  <span>Upload complete! Redirecting...</span>
                </div>
              )}

              {/* Error */}
              {status === "error" && (
                <div className="mt-4 flex items-center gap-2 text-red-400">
                  <AlertCircle className="h-5 w-5" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          )}

          {/* Title Input */}
          {file && status === "idle" && (
            <div className="space-y-2">
              <Label htmlFor="title" className="text-gray-200">
                Video Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter video title"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          )}

          {/* Upload Button */}
          {file && status === "idle" && (
            <Button
              onClick={handleUpload}
              className="w-full"
              disabled={!title}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Video
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
