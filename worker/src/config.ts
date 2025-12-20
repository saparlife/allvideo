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
    { name: "360p", width: 640, height: 360, bitrate: "800k" },
    { name: "480p", width: 854, height: 480, bitrate: "1400k" },
    { name: "720p", width: 1280, height: 720, bitrate: "2800k" },
    { name: "1080p", width: 1920, height: 1080, bitrate: "5000k" },
  ],
};
