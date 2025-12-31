"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const supabase_1 = require("./supabase");
const r2_1 = require("./r2");
const transcoder_1 = require("./transcoder");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
console.log(`
╔═══════════════════════════════════════════════════════════════╗
║               AllVideo.one Transcoding Worker                 ║
║                                                               ║
║  Worker ID: ${config_1.config.worker.id.padEnd(47)}║
║  Poll Interval: ${(config_1.config.worker.pollInterval / 1000 + "s").padEnd(44)}║
╚═══════════════════════════════════════════════════════════════╝
`);
async function processJob() {
    const result = await (0, supabase_1.claimJob)();
    if (!result) {
        return false;
    }
    const { job, video } = result;
    console.log(`\n📹 Processing video: ${video.title} (${video.id})`);
    const workDir = path.join(config_1.config.worker.tempDir, video.id);
    const inputPath = path.join(workDir, "input" + path.extname(video.original_key));
    const outputDir = path.join(workDir, "hls");
    try {
        // Download original file
        console.log("⬇️  Downloading original file...");
        await (0, r2_1.downloadFile)(video.original_key, inputPath);
        await (0, supabase_1.updateJobProgress)(job.id, 10);
        // Transcode to HLS
        console.log("🔄 Transcoding to HLS...");
        const { duration, thumbnailPath } = await (0, transcoder_1.transcodeToHLS)(inputPath, outputDir, async (progress) => {
            const adjustedProgress = 10 + Math.round(progress * 0.8);
            await (0, supabase_1.updateJobProgress)(job.id, adjustedProgress);
            process.stdout.write(`\r   Progress: ${adjustedProgress}%`);
        });
        console.log("\n");
        // Upload HLS files to R2 (includes poster.jpg)
        console.log("⬆️  Uploading HLS files to R2...");
        const hlsPrefix = `users/${video.user_id}/hls/${video.id}`;
        await (0, r2_1.uploadDirectory)(outputDir, hlsPrefix);
        await (0, supabase_1.updateJobProgress)(job.id, 95);
        // Complete the job - thumbnail is in the hls folder (uploaded by uploadDirectory)
        const hlsKey = `${hlsPrefix}/master.m3u8`;
        const thumbnailKey = `${hlsPrefix}/poster.jpg`;
        await (0, supabase_1.completeJob)(job.id, video.id, hlsKey, thumbnailKey, Math.round(duration));
        console.log(`✅ Completed: ${video.title}`);
        // Cleanup
        (0, transcoder_1.cleanupTempFiles)(workDir);
        return true;
    }
    catch (error) {
        console.error(`❌ Error processing ${video.title}:`, error);
        await (0, supabase_1.failJob)(job.id, video.id, error instanceof Error ? error.message : "Unknown error");
        (0, transcoder_1.cleanupTempFiles)(workDir);
        return true;
    }
}
async function main() {
    // Ensure temp directory exists
    if (!fs.existsSync(config_1.config.worker.tempDir)) {
        fs.mkdirSync(config_1.config.worker.tempDir, { recursive: true });
    }
    console.log("🚀 Worker started, polling for jobs...\n");
    while (true) {
        try {
            const processed = await processJob();
            if (!processed) {
                // No jobs available, wait before polling again
                await new Promise((resolve) => setTimeout(resolve, config_1.config.worker.pollInterval));
            }
        }
        catch (error) {
            console.error("Worker error:", error);
            await new Promise((resolve) => setTimeout(resolve, config_1.config.worker.pollInterval));
        }
    }
}
main().catch(console.error);
