import { config } from "./config";
import { claimJob, updateJobProgress, completeJob, failJob, releaseJob } from "./supabase";
import { downloadFile, uploadDirectory } from "./r2";
import { transcodeToHLS, cleanupTempFiles } from "./transcoder";
import * as path from "path";
import * as fs from "fs";

// Graceful shutdown state
let isShuttingDown = false;
let currentJob: { id: string; videoId: string; workDir: string } | null = null;

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║               stream.1app.to Media Processing Worker          ║
║                                                               ║
║  Worker ID: ${config.worker.id.padEnd(47)}║
║  Poll Interval: ${(config.worker.pollInterval / 1000 + "s").padEnd(44)}║
╚═══════════════════════════════════════════════════════════════╝
`);

// Handle graceful shutdown
async function handleShutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    console.log("\n⚠️  Force shutdown requested, exiting immediately...");
    process.exit(1);
  }

  isShuttingDown = true;
  console.log(`\n🛑 Received ${signal}, initiating graceful shutdown...`);

  if (currentJob) {
    console.log(`⏳ Waiting for current job to complete: ${currentJob.id}`);
    // The main loop will exit after the current job finishes
  } else {
    console.log("✅ No active job, shutting down immediately.");
    process.exit(0);
  }
}

// Register signal handlers
process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGINT", () => handleShutdown("SIGINT"));

// Handle uncaught errors
process.on("uncaughtException", async (error) => {
  console.error("💥 Uncaught exception:", error);

  if (currentJob) {
    console.log(`🔄 Releasing job ${currentJob.id} back to queue...`);
    try {
      await releaseJob(currentJob.id);
      cleanupTempFiles(currentJob.workDir);
    } catch (e) {
      console.error("Failed to release job:", e);
    }
  }

  process.exit(1);
});

process.on("unhandledRejection", async (reason, promise) => {
  console.error("💥 Unhandled rejection at:", promise, "reason:", reason);
});

async function processJob(): Promise<boolean> {
  if (isShuttingDown) {
    return false;
  }

  const result = await claimJob();

  if (!result) {
    return false;
  }

  const { job, video } = result;
  const workDir = path.join(config.worker.tempDir, video.id);

  // Track current job for graceful shutdown
  currentJob = { id: job.id, videoId: video.id, workDir };

  console.log(`\n📹 Processing video: ${video.title} (${video.id})`);

  const inputPath = path.join(workDir, "input" + path.extname(video.original_key));
  const outputDir = path.join(workDir, "hls");

  try {
    // Download original file
    console.log("⬇️  Downloading original file...");
    await downloadFile(video.original_key, inputPath);
    await updateJobProgress(job.id, 10);

    // Check if shutdown was requested
    if (isShuttingDown) {
      console.log("🛑 Shutdown requested, but completing current transcode...");
    }

    // Transcode to HLS
    console.log("🔄 Transcoding to HLS...");
    const { duration } = await transcodeToHLS(
      inputPath,
      outputDir,
      async (progress) => {
        const adjustedProgress = 10 + Math.round(progress * 0.8);
        await updateJobProgress(job.id, adjustedProgress);
        process.stdout.write(`\r   Progress: ${adjustedProgress}%`);
      }
    );
    console.log("\n");

    // Upload HLS files to R2 (includes poster.jpg)
    console.log("⬆️  Uploading HLS files to R2...");
    const hlsPrefix = `users/${video.user_id}/hls/${video.id}`;
    await uploadDirectory(outputDir, hlsPrefix);
    await updateJobProgress(job.id, 95);

    // Complete the job - thumbnail is in the hls folder (uploaded by uploadDirectory)
    const hlsKey = `${hlsPrefix}/master.m3u8`;
    const thumbnailKey = `${hlsPrefix}/poster.jpg`;
    await completeJob(job.id, video.id, hlsKey, thumbnailKey, Math.round(duration));

    console.log(`✅ Completed: ${video.title}`);

    // Cleanup
    cleanupTempFiles(workDir);
    currentJob = null;

    return true;
  } catch (error) {
    console.error(`❌ Error processing ${video.title}:`, error);
    await failJob(job.id, video.id, error instanceof Error ? error.message : "Unknown error");
    cleanupTempFiles(workDir);
    currentJob = null;
    return true;
  }
}

async function main(): Promise<void> {
  // Ensure temp directory exists
  if (!fs.existsSync(config.worker.tempDir)) {
    fs.mkdirSync(config.worker.tempDir, { recursive: true });
  }

  console.log("🚀 Worker started, polling for jobs...\n");

  while (!isShuttingDown) {
    try {
      const processed = await processJob();

      if (!processed && !isShuttingDown) {
        // No jobs available, wait before polling again
        await new Promise((resolve) => setTimeout(resolve, config.worker.pollInterval));
      }
    } catch (error) {
      console.error("Worker error:", error);
      if (!isShuttingDown) {
        await new Promise((resolve) => setTimeout(resolve, config.worker.pollInterval));
      }
    }
  }

  console.log("👋 Worker shutdown complete.");
  process.exit(0);
}

main().catch(console.error);
