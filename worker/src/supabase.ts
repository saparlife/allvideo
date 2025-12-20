import { createClient } from "@supabase/supabase-js";
import { config } from "./config";

export const supabase = createClient(config.supabase.url, config.supabase.serviceKey);

export interface TranscodeJob {
  id: string;
  video_id: string;
  status: string;
  progress: number;
  error_message: string | null;
  worker_id: string | null;
  started_at: string | null;
  completed_at: string | null;
}

export interface Video {
  id: string;
  user_id: string;
  title: string;
  original_key: string;
  original_size_bytes: number;
  status: string;
}

interface ClaimJobResult {
  job_id: string;
  video_id: string;
  original_key: string;
  user_id: string;
}

export async function claimJob(): Promise<{ job: TranscodeJob; video: Video } | null> {
  const { data, error } = await supabase.rpc("claim_transcode_job", {
    worker_name: config.worker.id,
  });

  if (error) {
    console.error("Error claiming job:", error);
    return null;
  }

  // RPC returns array for table-returning functions
  const results = data as ClaimJobResult[] | null;
  if (!results || results.length === 0) {
    return null;
  }

  const claimed = results[0];

  // Get video details
  const { data: video, error: videoError } = await supabase
    .from("videos")
    .select("*")
    .eq("id", claimed.video_id)
    .single();

  if (videoError || !video) {
    console.error("Error fetching video:", videoError);
    return null;
  }

  // Build job object from claimed data
  const job: TranscodeJob = {
    id: claimed.job_id,
    video_id: claimed.video_id,
    status: "processing",
    progress: 0,
    error_message: null,
    worker_id: config.worker.id,
    started_at: new Date().toISOString(),
    completed_at: null,
  };

  return { job, video: video as Video };
}

export async function updateJobProgress(jobId: string, progress: number): Promise<void> {
  await supabase
    .from("transcode_jobs")
    .update({ progress })
    .eq("id", jobId);
}

export async function completeJob(
  jobId: string,
  videoId: string,
  hlsKey: string,
  thumbnailUrl: string,
  duration: number
): Promise<void> {
  const publicHlsUrl = `${config.r2.publicUrl}/${hlsKey}`;
  const publicThumbnailUrl = `${config.r2.publicUrl}/${thumbnailUrl}`;

  await supabase
    .from("transcode_jobs")
    .update({
      status: "completed",
      progress: 100,
      completed_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  await supabase
    .from("videos")
    .update({
      status: "ready",
      hls_key: hlsKey,
      hls_url: publicHlsUrl,
      thumbnail_url: publicThumbnailUrl,
      duration_seconds: duration,
    })
    .eq("id", videoId);
}

export async function failJob(jobId: string, videoId: string, errorMessage: string): Promise<void> {
  await supabase
    .from("transcode_jobs")
    .update({
      status: "failed",
      error_message: errorMessage,
      completed_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  await supabase
    .from("videos")
    .update({ status: "failed" })
    .eq("id", videoId);
}
