"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
exports.claimJob = claimJob;
exports.updateJobProgress = updateJobProgress;
exports.completeJob = completeJob;
exports.failJob = failJob;
const supabase_js_1 = require("@supabase/supabase-js");
const config_1 = require("./config");
exports.supabase = (0, supabase_js_1.createClient)(config_1.config.supabase.url, config_1.config.supabase.serviceKey);
async function claimJob() {
    const { data, error } = await exports.supabase.rpc("claim_transcode_job", {
        worker_name: config_1.config.worker.id,
    });
    if (error) {
        console.error("Error claiming job:", error);
        return null;
    }
    // RPC returns array for table-returning functions
    const results = data;
    if (!results || results.length === 0) {
        return null;
    }
    const claimed = results[0];
    // Get video details
    const { data: video, error: videoError } = await exports.supabase
        .from("videos")
        .select("*")
        .eq("id", claimed.video_id)
        .single();
    if (videoError || !video) {
        console.error("Error fetching video:", videoError);
        return null;
    }
    // Build job object from claimed data
    const job = {
        id: claimed.job_id,
        video_id: claimed.video_id,
        status: "processing",
        progress: 0,
        error_message: null,
        worker_id: config_1.config.worker.id,
        started_at: new Date().toISOString(),
        completed_at: null,
    };
    return { job, video: video };
}
async function updateJobProgress(jobId, progress) {
    await exports.supabase
        .from("transcode_jobs")
        .update({ progress })
        .eq("id", jobId);
}
async function completeJob(jobId, videoId, hlsKey, thumbnailKey, duration) {
    // Update job status
    const { error: jobError } = await exports.supabase
        .from("transcode_jobs")
        .update({
        status: "completed",
        progress: 100,
        completed_at: new Date().toISOString(),
    })
        .eq("id", jobId);
    if (jobError) {
        console.error("Error updating job:", jobError);
    }
    // Update video status
    const { error: videoError } = await exports.supabase
        .from("videos")
        .update({
        status: "ready",
        hls_key: hlsKey,
        thumbnail_key: thumbnailKey,
        duration_seconds: duration,
    })
        .eq("id", videoId);
    if (videoError) {
        console.error("Error updating video:", videoError);
    }
}
async function failJob(jobId, videoId, errorMessage) {
    await exports.supabase
        .from("transcode_jobs")
        .update({
        status: "failed",
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
    })
        .eq("id", jobId);
    await exports.supabase
        .from("videos")
        .update({ status: "failed" })
        .eq("id", videoId);
}
