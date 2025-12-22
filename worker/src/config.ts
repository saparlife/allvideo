import dotenv from "dotenv";
dotenv.config();

export const config = {
  supabase: {
    url: process.env.SUPABASE_URL!,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  },
  r2: {
    accountId: process.env.R2_ACCOUNT_ID!,
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    bucket: process.env.R2_BUCKET!,
    publicUrl: process.env.R2_PUBLIC_URL!,
  },
  worker: {
    id: process.env.WORKER_ID || `worker-${Date.now()}`,
    pollInterval: parseInt(process.env.POLL_INTERVAL || "10000"),
    tempDir: process.env.TEMP_DIR || "/tmp/allvideo",
  },
  resolutions: [
    // CRF-based encoding: crf 23 = visually lossless, maxrate limits peaks for streaming
    { name: "360p", width: 640, height: 360, crf: 24, maxrate: "800k", bufsize: "1200k" },
    { name: "480p", width: 854, height: 480, crf: 23, maxrate: "1500k", bufsize: "2250k" },
    { name: "720p", width: 1280, height: 720, crf: 23, maxrate: "3000k", bufsize: "4500k" },
    { name: "1080p", width: 1920, height: 1080, crf: 22, maxrate: "5000k", bufsize: "7500k" },
  ],
  encoding: {
    preset: "slow",        // slow = good compression, medium = faster, veryslow = best
    profile: "high",       // H.264 High Profile
    tune: "film",          // "film" for live action, "animation" for cartoons
    audioBitrate: "128k",
  },
};
