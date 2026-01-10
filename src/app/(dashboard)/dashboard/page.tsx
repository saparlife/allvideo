"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { HardDrive, Wifi, FolderOpen, Upload, Plus, Loader2, Video, Image, Music, FileText } from "lucide-react";
import Link from "next/link";
import type { User } from "@/types/database";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

interface MediaStats {
  total: number;
  ready: number;
  processing: number;
  videos: number;
  images: number;
  audio: number;
  files: number;
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<User | null>(null);
  const [stats, setStats] = useState<MediaStats>({
    total: 0, ready: 0, processing: 0,
    videos: 0, images: 0, audio: 0, files: 0
  });
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch profile
      const { data: profileData } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData) setProfile(profileData as User);

      // Fetch media counts
      const [totalRes, readyRes, processingRes, videosRes, imagesRes, audioRes, filesRes] = await Promise.all([
        supabase.from("videos").select("*", { count: "exact", head: true }).eq("user_id", user.id).neq("status", "deleted"),
        supabase.from("videos").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "ready"),
        supabase.from("videos").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "processing"),
        supabase.from("videos").select("*", { count: "exact", head: true }).eq("user_id", user.id).or("media_type.eq.video,media_type.is.null"),
        supabase.from("videos").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("media_type", "image"),
        supabase.from("videos").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("media_type", "audio"),
        supabase.from("videos").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("media_type", "file"),
      ]);

      setStats({
        total: totalRes.count || 0,
        ready: readyRes.count || 0,
        processing: processingRes.count || 0,
        videos: videosRes.count || 0,
        images: imagesRes.count || 0,
        audio: audioRes.count || 0,
        files: filesRes.count || 0,
      });
      setLoading(false);
    }

    loadData();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const storagePercent = profile
    ? (profile.storage_used_bytes / profile.storage_limit_bytes) * 100
    : 0;

  const bandwidthPercent = profile
    ? (profile.bandwidth_used_bytes / profile.bandwidth_limit_bytes) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">
            Welcome back, {profile?.name || profile?.email}
          </p>
        </div>
        <Button asChild className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white">
          <Link href="/media/upload">
            <Plus className="mr-2 h-4 w-4" />
            Upload Media
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Storage */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Storage Used
            </CardTitle>
            <HardDrive className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatBytes(profile?.storage_used_bytes || 0)}
            </div>
            <p className="text-xs text-gray-500 mb-2">
              of {formatBytes(profile?.storage_limit_bytes || 0)}
            </p>
            <Progress value={storagePercent} className="h-2" />
          </CardContent>
        </Card>

        {/* Bandwidth */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Bandwidth (Monthly)
            </CardTitle>
            <Wifi className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatBytes(profile?.bandwidth_used_bytes || 0)}
            </div>
            <p className="text-xs text-gray-500 mb-2">
              of {formatBytes(profile?.bandwidth_limit_bytes || 0)}
            </p>
            <Progress value={bandwidthPercent} className="h-2" />
          </CardContent>
        </Card>

        {/* Total Media */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Media
            </CardTitle>
            <FolderOpen className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.total}
            </div>
            <p className="text-xs text-gray-500">
              {stats.ready} ready, {stats.processing} processing
            </p>
          </CardContent>
        </Card>

        {/* Quick Upload */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Quick Actions
            </CardTitle>
            <Upload className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50">
              <Link href="/media/upload">
                <Upload className="mr-2 h-4 w-4" />
                Upload Media
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Media by Type */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-white border-gray-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Video className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.videos}</p>
                <p className="text-sm text-gray-500">Videos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Image className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.images}</p>
                <p className="text-sm text-gray-500">Images</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Music className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.audio}</p>
                <p className="text-sm text-gray-500">Audio</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-gray-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FileText className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.files}</p>
                <p className="text-sm text-gray-500">Files</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Media */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Recent Media</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.total === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No media yet
              </h3>
              <p className="text-gray-500 mb-4">
                Upload your first file to get started
              </p>
              <Button asChild className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white">
                <Link href="/media/upload">
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Media
                </Link>
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <Button asChild variant="outline">
                <Link href="/media">
                  View All Media
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
