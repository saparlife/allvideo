"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Clock,
  HardDrive,
  Link2,
  Download,
  FileText,
  File,
  FileImage,
  FileCode,
  FileArchive,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Props {
  params: Promise<{ id: string }>;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getStatusBadge(status: string) {
  switch (status) {
    case "ready":
      return <Badge className="bg-emerald-500 text-white">Ready</Badge>;
    case "processing":
      return <Badge className="bg-yellow-500 text-white">Processing</Badge>;
    case "failed":
      return <Badge className="bg-red-500 text-white">Failed</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

function getFileIcon(filename: string, mimeType: string) {
  const ext = filename.split(".").pop()?.toLowerCase();

  if (mimeType === "application/pdf" || ext === "pdf") {
    return <FileText className="h-12 w-12 text-red-500" />;
  }
  if (["doc", "docx", "txt", "rtf", "odt"].includes(ext || "")) {
    return <FileText className="h-12 w-12 text-blue-500" />;
  }
  if (["xls", "xlsx", "csv"].includes(ext || "")) {
    return <FileText className="h-12 w-12 text-green-500" />;
  }
  if (["ppt", "pptx"].includes(ext || "")) {
    return <FileImage className="h-12 w-12 text-orange-500" />;
  }
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext || "")) {
    return <FileArchive className="h-12 w-12 text-yellow-500" />;
  }
  if (["js", "ts", "py", "java", "cpp", "c", "html", "css", "json", "xml"].includes(ext || "")) {
    return <FileCode className="h-12 w-12 text-purple-500" />;
  }
  return <File className="h-12 w-12 text-gray-500" />;
}

function isPDF(filename: string, mimeType: string): boolean {
  return mimeType === "application/pdf" || filename.toLowerCase().endsWith(".pdf");
}

interface FileData {
  id: string;
  title: string;
  status: string;
  original_key: string | null;
  original_filename: string;
  mime_type: string;
  original_size_bytes: number;
  created_at: string;
  custom_metadata: Record<string, unknown>;
}

export default function FileDetailPage({ params }: Props) {
  const [file, setFile] = useState<FileData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();
  const r2Url = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";

  useEffect(() => {
    async function loadFile() {
      const { id } = await params;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .eq("media_type", "file")
        .single();

      if (error || !data) {
        toast.error("File not found");
        router.push("/media");
        return;
      }

      setFile(data as FileData);
      setLoading(false);
    }

    loadFile();
  }, [params, supabase, router]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!file) return null;

  const fileUrl = file.original_key ? `${r2Url}/${file.original_key}` : null;
  const showPdfViewer = file.status === "ready" && fileUrl && isPDF(file.original_filename, file.mime_type);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="text-gray-600 hover:text-gray-900 hover:bg-gray-100">
          <Link href="/media">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{file.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            {getStatusBadge(file.status)}
            <span className="text-sm text-gray-500">{file.original_filename}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* File Preview */}
        <div className="lg:col-span-2">
          <Card className="bg-white border-gray-200 overflow-hidden">
            <CardContent className="p-0">
              {showPdfViewer ? (
                <div className="w-full" style={{ height: "80vh" }}>
                  <iframe
                    src={`${fileUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                    className="w-full h-full border-0"
                    title={file.title}
                  />
                </div>
              ) : file.status === "ready" && fileUrl ? (
                <div className="p-12 flex flex-col items-center justify-center bg-gray-50">
                  {getFileIcon(file.original_filename, file.mime_type)}
                  <p className="mt-4 text-lg font-medium text-gray-900">{file.original_filename}</p>
                  <p className="text-sm text-gray-500 mt-1">{formatBytes(file.original_size_bytes)}</p>
                  <div className="flex gap-3 mt-6">
                    <Button asChild>
                      <a href={fileUrl} download target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </a>
                    </Button>
                    <Button asChild variant="outline">
                      <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open in New Tab
                      </a>
                    </Button>
                  </div>
                </div>
              ) : file.status === "processing" ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                    <p className="text-gray-700 font-medium">Processing file...</p>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-gray-500">File not available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Stats */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900 text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Type
                </span>
                <span className="text-gray-900 font-medium">
                  {file.original_filename.split(".").pop()?.toUpperCase() || "Unknown"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  Size
                </span>
                <span className="text-gray-900 font-medium">{formatBytes(file.original_size_bytes)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Uploaded
                </span>
                <span className="text-gray-900 font-medium">
                  {new Date(file.created_at).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* URL */}
          {file.status === "ready" && fileUrl && (
            <Card className="bg-white border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-gray-900 text-lg flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  File URL
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 rounded-lg p-3 break-all">
                  <code className="text-xs text-gray-700">{fileUrl}</code>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => copyToClipboard(fileUrl)}>
                    Copy URL
                  </Button>
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <a href={fileUrl} download target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
