"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  ArrowLeft,
  Clock,
  HardDrive,
  Link2,
  Download,
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
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

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
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

interface AudioData {
  id: string;
  title: string;
  status: string;
  original_key: string | null;
  original_size_bytes: number;
  duration_seconds: number | null;
  created_at: string;
  custom_metadata: Record<string, unknown>;
}

export default function AudioDetailPage({ params }: Props) {
  const [audio, setAudio] = useState<AudioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const router = useRouter();
  const supabase = createClient();
  const r2Url = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "").trim();

  useEffect(() => {
    async function loadAudio() {
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
        .eq("media_type", "audio")
        .single();

      if (error || !data) {
        toast.error("Audio not found");
        router.push("/media");
        return;
      }

      setAudio(data as AudioData);
      setLoading(false);
    }

    loadAudio();
  }, [params, supabase, router]);

  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    const handleTimeUpdate = () => setCurrentTime(audioEl.currentTime);
    const handleDurationChange = () => setDuration(audioEl.duration);
    const handleEnded = () => setIsPlaying(false);

    audioEl.addEventListener("timeupdate", handleTimeUpdate);
    audioEl.addEventListener("durationchange", handleDurationChange);
    audioEl.addEventListener("ended", handleEnded);

    return () => {
      audioEl.removeEventListener("timeupdate", handleTimeUpdate);
      audioEl.removeEventListener("durationchange", handleDurationChange);
      audioEl.removeEventListener("ended", handleEnded);
    };
  }, [audio]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    if (!audioRef.current) return;
    const newVolume = value[0];
    audioRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 1;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const skip = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
  };

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

  if (!audio) return null;

  const audioUrl = audio.original_key ? `${r2Url}/${audio.original_key}` : null;

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
          <h1 className="text-2xl font-bold text-gray-900">{audio.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            {getStatusBadge(audio.status)}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Audio Player */}
        <div className="lg:col-span-2">
          <Card className="bg-white border-gray-200">
            <CardContent className="p-6">
              {audio.status === "ready" && audioUrl ? (
                <div className="space-y-6">
                  <audio ref={audioRef} src={audioUrl} preload="metadata" />

                  {/* Waveform placeholder */}
                  <div className="h-24 bg-gradient-to-r from-indigo-100 via-purple-100 to-indigo-100 rounded-lg flex items-center justify-center">
                    <div className="flex items-end gap-1 h-16">
                      {Array.from({ length: 50 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-1 bg-indigo-400 rounded-full transition-all duration-150"
                          style={{
                            height: `${Math.random() * 100}%`,
                            opacity: currentTime / duration > i / 50 ? 1 : 0.3,
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <Slider
                      value={[currentTime]}
                      max={duration || 100}
                      step={0.1}
                      onValueChange={handleSeek}
                      className="cursor-pointer"
                    />
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => skip(-10)}>
                      <SkipBack className="h-5 w-5" />
                    </Button>
                    <Button
                      size="lg"
                      className="h-14 w-14 rounded-full bg-indigo-500 hover:bg-indigo-600"
                      onClick={togglePlay}
                    >
                      {isPlaying ? (
                        <Pause className="h-6 w-6" />
                      ) : (
                        <Play className="h-6 w-6 ml-1" />
                      )}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => skip(10)}>
                      <SkipForward className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Volume */}
                  <div className="flex items-center gap-3 max-w-xs mx-auto">
                    <Button variant="ghost" size="icon" onClick={toggleMute}>
                      {isMuted ? (
                        <VolumeX className="h-5 w-5" />
                      ) : (
                        <Volume2 className="h-5 w-5" />
                      )}
                    </Button>
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      max={1}
                      step={0.01}
                      onValueChange={handleVolumeChange}
                      className="flex-1"
                    />
                  </div>
                </div>
              ) : audio.status === "processing" ? (
                <div className="h-48 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                    <p className="text-gray-700 font-medium">Processing audio...</p>
                  </div>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center">
                  <p className="text-gray-500">Audio not available</p>
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
              {audio.duration_seconds && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Duration
                  </span>
                  <span className="text-gray-900 font-medium">{formatTime(audio.duration_seconds)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-500 flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  Size
                </span>
                <span className="text-gray-900 font-medium">{formatBytes(audio.original_size_bytes)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Uploaded</span>
                <span className="text-gray-900 font-medium">
                  {new Date(audio.created_at).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* URL */}
          {audio.status === "ready" && audioUrl && (
            <Card className="bg-white border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-gray-900 text-lg flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Audio URL
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 rounded-lg p-3 break-all">
                  <code className="text-xs text-gray-700">{audioUrl}</code>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => copyToClipboard(audioUrl)}>
                    Copy URL
                  </Button>
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <a href={audioUrl} download target="_blank" rel="noopener noreferrer">
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
