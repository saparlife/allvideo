"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { HardDrive, Wifi, Video, Upload, Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import type { User } from "@/types/database";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<User | null>(null);
  const [stats, setStats] = useState({ total: 0, ready: 0, processing: 0 });
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

      // Fetch video counts in parallel
      const [totalRes, readyRes, processingRes] = await Promise.all([
        supabase.from("videos").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("videos").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "ready"),
        supabase.from("videos").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "processing"),
      ]);

      setStats({
        total: totalRes.count || 0,
        ready: readyRes.count || 0,
        processing: processingRes.count || 0,
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
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400">
            Welcome back, {profile?.name || profile?.email}
          </p>
        </div>
        <Button asChild>
          <Link href="/videos/upload">
            <Plus className="mr-2 h-4 w-4" />
            Upload Video
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Storage */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Storage Used
            </CardTitle>
            <HardDrive className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatBytes(profile?.storage_used_bytes || 0)}
            </div>
            <p className="text-xs text-gray-500 mb-2">
              of {formatBytes(profile?.storage_limit_bytes || 0)}
            </p>
            <Progress value={storagePercent} className="h-2" />
          </CardContent>
        </Card>

        {/* Bandwidth */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Bandwidth (Monthly)
            </CardTitle>
            <Wifi className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatBytes(profile?.bandwidth_used_bytes || 0)}
            </div>
            <p className="text-xs text-gray-500 mb-2">
              of {formatBytes(profile?.bandwidth_limit_bytes || 0)}
            </p>
            <Progress value={bandwidthPercent} className="h-2" />
          </CardContent>
        </Card>

        {/* Total Videos */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Total Videos
            </CardTitle>
            <Video className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats.total}
            </div>
            <p className="text-xs text-gray-500">
              {stats.ready} ready, {stats.processing} processing
            </p>
          </CardContent>
        </Card>

        {/* Quick Upload */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Quick Actions
            </CardTitle>
            <Upload className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/videos/upload">
                <Upload className="mr-2 h-4 w-4" />
                Upload New Video
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Videos */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Recent Videos</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.total === 0 ? (
            <div className="text-center py-12">
              <Video className="h-12 w-12 mx-auto text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                No videos yet
              </h3>
              <p className="text-gray-400 mb-4">
                Upload your first video to get started
              </p>
              <Button asChild>
                <Link href="/videos/upload">
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Video
                </Link>
              </Button>
            </div>
          ) : (
            <p className="text-gray-400">
              Your recent videos will appear here
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
