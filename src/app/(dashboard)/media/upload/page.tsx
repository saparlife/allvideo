"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  X,
  Video,
  Image,
  Music,
  FileText,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

type UploadStatus = "idle" | "uploading" | "processing" | "complete" | "error";
type MediaType = "video" | "image" | "audio" | "file";

const CONCURRENT_UPLOADS = 4;

interface PartInfo {
  partNumber: number;
  uploadUrl: string;
}

interface UploadedPart {
  partNumber: number;
  etag: string;
}

const ACCEPTED_TYPES: Record<MediaType, { accept: string; desc: string; maxSize: string }> = {
  video: {
    accept: "video/*",
    desc: "MP4, MOV, AVI, MKV, WMV",
    maxSize: "10GB",
  },
  image: {
    accept: "image/*",
    desc: "JPG, PNG, GIF, WebP, AVIF",
    maxSize: "50MB",
  },
  audio: {
    accept: "audio/*",
    desc: "MP3, WAV, AAC, FLAC, OGG",
    maxSize: "500MB",
  },
  file: {
    accept: "*/*",
    desc: "Any file type",
    maxSize: "2GB",
  },
};

function getMediaTypeFromFile(file: File): MediaType {
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("audio/")) return "audio";
  return "file";
}

function getTypeIcon(type: MediaType) {
  switch (type) {
    case "video":
      return <Video className="h-6 w-6 text-gray-500" />;
    case "image":
      return <Image className="h-6 w-6 text-gray-500" />;
    case "audio":
      return <Music className="h-6 w-6 text-gray-500" />;
    default:
      return <FileText className="h-6 w-6 text-gray-500" />;
  }
}

export default function UploadPage() {
  const [mediaType, setMediaType] = useState<MediaType>("video");
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [uploadSpeed, setUploadSpeed] = useState<string>("");
  const router = useRouter();
  const abortControllerRef = useRef<AbortController | null>(null);

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
      const detectedType = getMediaTypeFromFile(droppedFile);
      setMediaType(detectedType);
      setFile(droppedFile);
      if (!title) {
        setTitle(droppedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  }, [title]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const detectedType = getMediaTypeFromFile(selectedFile);
      setMediaType(detectedType);
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const uploadPart = async (
    file: File,
    part: PartInfo,
    chunkSize: number,
    signal: AbortSignal
  ): Promise<UploadedPart> => {
    const start = (part.partNumber - 1) * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);

    const response = await fetch(part.uploadUrl, {
      method: "PUT",
      body: chunk,
      signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload part ${part.partNumber}`);
    }

    const etag = response.headers.get("ETag") || "";
    return { partNumber: part.partNumber, etag };
  };

  const handleVideoUpload = async () => {
    if (!file || !title) return;

    abortControllerRef.current = new AbortController();
    const startTime = Date.now();
    let totalUploaded = 0;

    // Step 1: Initialize multipart upload
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

    const { videoId, uploadId, parts, chunkSize } = await initResponse.json();

    // Step 2: Upload parts in parallel
    const uploadedParts: UploadedPart[] = [];
    const partsQueue = [...parts] as PartInfo[];
    const inProgress = new Set<number>();

    const updateProgress = () => {
      const progress = Math.round((uploadedParts.length / parts.length) * 100);
      setUploadProgress(progress);

      const elapsed = (Date.now() - startTime) / 1000;
      if (elapsed > 0) {
        const bytesPerSecond = totalUploaded / elapsed;
        const mbps = (bytesPerSecond * 8) / (1024 * 1024);
        setUploadSpeed(`${mbps.toFixed(1)} Mbps`);
      }
    };

    const processQueue = async () => {
      while (partsQueue.length > 0 || inProgress.size > 0) {
        while (partsQueue.length > 0 && inProgress.size < CONCURRENT_UPLOADS) {
          const part = partsQueue.shift()!;
          inProgress.add(part.partNumber);

          uploadPart(file, part, chunkSize, abortControllerRef.current!.signal)
            .then((uploadedPart) => {
              uploadedParts.push(uploadedPart);
              totalUploaded += Math.min(chunkSize, file.size - (part.partNumber - 1) * chunkSize);
              inProgress.delete(part.partNumber);
              updateProgress();
            })
            .catch((err) => {
              if (err.name !== "AbortError") {
                throw err;
              }
            });
        }

        await new Promise((resolve) => setTimeout(resolve, 100));

        if (partsQueue.length === 0 && inProgress.size === 0) {
          break;
        }
      }
    };

    await processQueue();

    uploadedParts.sort((a, b) => a.partNumber - b.partNumber);

    setUploadProgress(100);
    setStatus("processing");

    // Step 3: Complete multipart upload
    const completeResponse = await fetch("/api/videos/upload/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        videoId,
        uploadId,
        parts: uploadedParts,
      }),
    });

    if (!completeResponse.ok) {
      throw new Error("Failed to complete upload");
    }
  };

  const handleDirectUpload = async () => {
    if (!file || !title) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);

    const endpoint = `/api/media/upload`;

    const xhr = new XMLHttpRequest();

    return new Promise<void>((resolve, reject) => {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(new Error(error.error || "Upload failed"));
          } catch {
            reject(new Error("Upload failed"));
          }
        }
      });

      xhr.addEventListener("error", () => reject(new Error("Upload failed")));
      xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));

      abortControllerRef.current = {
        abort: () => xhr.abort(),
        signal: { aborted: false } as AbortSignal,
      } as AbortController;

      xhr.open("POST", endpoint);
      xhr.send(formData);
    });
  };

  const handleUpload = async () => {
    if (!file || !title) {
      toast.error("Please select a file and enter a title");
      return;
    }

    setStatus("uploading");
    setUploadProgress(0);
    setErrorMessage("");
    setUploadSpeed("");

    try {
      if (mediaType === "video") {
        await handleVideoUpload();
      } else {
        await handleDirectUpload();
      }

      setStatus("complete");
      toast.success(`${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} uploaded successfully!`);

      setTimeout(() => {
        router.push("/media");
      }, 2000);
    } catch (error) {
      if ((error as Error).name === "AbortError" || (error as Error).message === "Upload cancelled") {
        setStatus("idle");
        setUploadProgress(0);
        return;
      }
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Upload failed");
      toast.error("Upload failed. Please try again.");
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setStatus("idle");
    setUploadProgress(0);
    setUploadSpeed("");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const typeConfig = ACCEPTED_TYPES[mediaType];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/media">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Upload Media</h1>
          <p className="text-gray-500">Upload videos, images, audio, or files</p>
        </div>
      </div>

      {/* Media Type Selector */}
      <Tabs value={mediaType} onValueChange={(v) => { setMediaType(v as MediaType); setFile(null); }}>
        <TabsList className="bg-gray-100 w-full">
          <TabsTrigger value="video" className="flex-1 data-[state=active]:bg-white">
            <Video className="w-4 h-4 mr-2" /> Video
          </TabsTrigger>
          <TabsTrigger value="image" className="flex-1 data-[state=active]:bg-white">
            <Image className="w-4 h-4 mr-2" /> Image
          </TabsTrigger>
          <TabsTrigger value="audio" className="flex-1 data-[state=active]:bg-white">
            <Music className="w-4 h-4 mr-2" /> Audio
          </TabsTrigger>
          <TabsTrigger value="file" className="flex-1 data-[state=active]:bg-white">
            <FileText className="w-4 h-4 mr-2" /> File
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900 capitalize">{mediaType} File</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drop Zone */}
          {!file ? (
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                dragActive
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Drop your {mediaType} here
              </p>
              <p className="text-sm text-gray-500 mb-4">or click to browse</p>
              <Input
                type="file"
                accept={typeConfig.accept}
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <Button
                asChild
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <label htmlFor="file-upload" className="cursor-pointer">
                  Select File
                </label>
              </Button>
              <p className="text-xs text-gray-400 mt-4">
                Supported: {typeConfig.desc} (max {typeConfig.maxSize})
              </p>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                  {getTypeIcon(mediaType)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                </div>
                {status === "idle" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setFile(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Progress */}
              {(status === "uploading" || status === "processing") && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">
                      {status === "uploading" ? "Uploading..." : "Processing..."}
                    </span>
                    <div className="flex items-center gap-3">
                      {uploadSpeed && status === "uploading" && (
                        <span className="text-emerald-600">{uploadSpeed}</span>
                      )}
                      <span className="text-gray-900 font-medium">{uploadProgress}%</span>
                    </div>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                  {status === "uploading" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancel}
                      className="text-red-500 hover:text-red-600 mt-2"
                    >
                      Cancel Upload
                    </Button>
                  )}
                </div>
              )}

              {/* Complete */}
              {status === "complete" && (
                <div className="mt-4 flex items-center gap-2 text-emerald-600">
                  <CheckCircle className="h-5 w-5" />
                  <span>Upload complete! Redirecting...</span>
                </div>
              )}

              {/* Error */}
              {status === "error" && (
                <div className="mt-4 flex items-center gap-2 text-red-500">
                  <AlertCircle className="h-5 w-5" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          )}

          {/* Title Input */}
          {file && status === "idle" && (
            <div className="space-y-2">
              <Label htmlFor="title" className="text-gray-700">
                Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title"
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>
          )}

          {/* Upload Button */}
          {file && status === "idle" && (
            <Button
              onClick={handleUpload}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
              disabled={!title}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload {mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
