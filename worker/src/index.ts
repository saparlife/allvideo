import { config } from "./config";
import { claimJob, updateJobProgress, completeJob, failJob, clearOriginalKey, saveTranscription, updateTranscriptionStatus } from "./supabase";
import { downloadFile, uploadDirectory, uploadFile, deleteFile } from "./r2";
import { transcodeToHLS, cleanupTempFiles } from "./transcoder";
import { transcribeVideo } from "./transcriber";
import * as path from "path";
import * as fs from "fs";

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║               AllVideo.one Transcoding Worker                 ║
║                                                               ║
║  Worker ID: ${config.worker.id.padEnd(47)}║
║  Poll Interval: ${(config.worker.pollInterval / 1000 + "s").padEnd(44)}║
╚═══════════════════════════════════════════════════════════════╝
`);

async function processJob(): Promise<boolean> {
  const result = await claimJob();

  if (!result) {
    return false;
  }

  const { job, video } = result;
  console.log(`\n📹 Processing video: ${video.title} (${video.id})`);

  const workDir = path.join(config.worker.tempDir, video.id);
  const inputPath = path.join(workDir, "input" + path.extname(video.original_key));
  const outputDir = path.join(workDir, "hls");

  try {
    // Download original file
    console.log("⬇️  Downloading original file...");
    await downloadFile(video.original_key, inputPath);
    await updateJobProgress(job.id, 10);

    // Transcode to HLS
    console.log("🔄 Transcoding to HLS...");
    const { duration, thumbnailPath } = await transcodeToHLS(
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
    await updateJobProgress(job.id, 92);

    // Transcribe video (uses original file before deletion)
    console.log("🎤 Transcribing video with Groq Whisper...");
    await updateTranscriptionStatus(video.id, "processing");
    const transcription = await transcribeVideo(inputPath);

    if (transcription) {
      await saveTranscription(
        video.id,
        transcription.text,
        transcription.vtt,
        transcription.segments,
        transcription.language
      );
      console.log(`   Language: ${transcription.language}, ${transcription.segments.length} segments`);
    } else {
      await updateTranscriptionStatus(video.id, "skipped");
      console.log("   Transcription skipped (no API key or file too large)");
    }
    await updateJobProgress(job.id, 98);

    // Complete the job - thumbnail is in the hls folder (uploaded by uploadDirectory)
    const hlsKey = `${hlsPrefix}/master.m3u8`;
    const thumbnailKey = `${hlsPrefix}/poster.jpg`;
    await completeJob(job.id, video.id, hlsKey, thumbnailKey, Math.round(duration));

    // Delete original file to save storage (HLS versions are enough)
    console.log("🗑️  Deleting original file to save storage...");
    try {
      await deleteFile(video.original_key);
      await clearOriginalKey(video.id);
      console.log(`   Deleted: ${video.original_key}`);
    } catch (deleteErr) {
      // Non-critical - log but don't fail the job
      console.warn(`   Warning: Could not delete original: ${deleteErr}`);
    }

    console.log(`✅ Completed: ${video.title}`);

    // Cleanup
    cleanupTempFiles(workDir);

    return true;
  } catch (error) {
    console.error(`❌ Error processing ${video.title}:`, error);
    await failJob(job.id, video.id, error instanceof Error ? error.message : "Unknown error");
    cleanupTempFiles(workDir);
    return true;
  }
}

async function main(): Promise<void> {
  // Ensure temp directory exists
  if (!fs.existsSync(config.worker.tempDir)) {
    fs.mkdirSync(config.worker.tempDir, { recursive: true });
  }

  console.log("🚀 Worker started, polling for jobs...\n");

  while (true) {
    try {
      const processed = await processJob();

      if (!processed) {
        // No jobs available, wait before polling again
        await new Promise((resolve) => setTimeout(resolve, config.worker.pollInterval));
      }
    } catch (error) {
      console.error("Worker error:", error);
      await new Promise((resolve) => setTimeout(resolve, config.worker.pollInterval));
    }
  }
}

main().catch(console.error);
