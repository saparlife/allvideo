import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/video/copy-button";
import { ArrowLeft, Clock, HardDrive, Link2, Maximize, Palette, Download } from "lucide-react";
import Link from "next/link";

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

export default async function ImageDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: image } = await (supabase as any)
    .from("videos")
    .select("*")
    .eq("id", id)
    .eq("user_id", user!.id)
    .eq("media_type", "image")
    .single();

  if (!image) {
    notFound();
  }

  const r2Url = process.env.R2_PUBLIC_URL || "";
  const originalUrl = image.original_key ? `${r2Url}/${image.original_key}` : null;

  // Fix variant URLs - replace old CDN domain with current one
  const rawVariants = (image.custom_metadata as { variants?: Record<string, { url: string; width: number; height: number; size: number }> })?.variants || {};
  const variants = Object.fromEntries(
    Object.entries(rawVariants).map(([name, variant]) => {
      // Extract path from URL and use current CDN
      const urlPath = variant.url.replace(/^https?:\/\/[^/]+/, '');
      return [name, { ...variant, url: `${r2Url}${urlPath}` }];
    })
  );
  const dominantColor = (image.custom_metadata as { dominantColor?: string })?.dominantColor;

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
          <h1 className="text-2xl font-bold text-gray-900">{image.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            {getStatusBadge(image.status)}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Image Preview */}
        <div className="lg:col-span-2">
          <Card className="bg-white border-gray-200 overflow-hidden">
            <CardContent className="p-0">
              {image.status === "ready" && originalUrl ? (
                <div className="relative bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={originalUrl}
                    alt={image.title}
                    className="w-full h-auto max-h-[600px] object-contain"
                  />
                </div>
              ) : image.status === "processing" ? (
                <div className="aspect-video bg-gray-100 flex items-center justify-center">
                  <div className="text-center px-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                    <p className="text-gray-700 font-medium">Processing image...</p>
                  </div>
                </div>
              ) : (
                <div className="aspect-video bg-gray-100 flex items-center justify-center">
                  <p className="text-gray-500">Image not available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Variants */}
          {Object.keys(variants).length > 0 && (
            <Card className="bg-white border-gray-200 mt-4">
              <CardHeader>
                <CardTitle className="text-gray-900 text-lg">Variants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(variants).map(([name, variant]) => (
                    <div key={name} className="space-y-2">
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={variant.url}
                          alt={`${name} variant`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-900 capitalize">{name}</p>
                        <p className="text-xs text-gray-500">{variant.width}x{variant.height}</p>
                        <p className="text-xs text-gray-400">{formatBytes(variant.size)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Stats */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900 text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {image.width && image.height && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 flex items-center gap-2">
                    <Maximize className="h-4 w-4" />
                    Resolution
                  </span>
                  <span className="text-gray-900 font-medium">{image.width}x{image.height}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-500 flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  Size
                </span>
                <span className="text-gray-900 font-medium">{formatBytes(image.original_size_bytes)}</span>
              </div>
              {dominantColor && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Color
                  </span>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded border border-gray-200"
                      style={{ backgroundColor: dominantColor }}
                    />
                    <span className="text-gray-900 font-medium text-sm">{dominantColor}</span>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-500 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Uploaded
                </span>
                <span className="text-gray-900 font-medium">
                  {new Date(image.created_at).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Original URL */}
          {image.status === "ready" && originalUrl && (
            <Card className="bg-white border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-gray-900 text-lg flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Original URL
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 rounded-lg p-3 break-all">
                  <code className="text-xs text-gray-700">{originalUrl}</code>
                </div>
                <div className="flex gap-2 mt-3">
                  <CopyButton text={originalUrl} label="Copy URL" />
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <a href={originalUrl} download target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Variant URLs */}
          {Object.keys(variants).length > 0 && (
            <Card className="bg-white border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-gray-900 text-lg">Variant URLs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(variants).map(([name, variant]) => (
                  <div key={name}>
                    <p className="text-sm font-medium text-gray-700 capitalize mb-1">{name}</p>
                    <div className="bg-gray-100 rounded-lg p-2 break-all">
                      <code className="text-xs text-gray-700">{variant.url}</code>
                    </div>
                    <CopyButton text={variant.url} label={`Copy ${name}`} />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
