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
exports.getVideoDuration = getVideoDuration;
exports.getVideoResolution = getVideoResolution;
exports.generateThumbnail = generateThumbnail;
exports.transcodeToHLS = transcodeToHLS;
exports.cleanupTempFiles = cleanupTempFiles;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const config_1 = require("./config");
async function getVideoDuration(inputPath) {
    return new Promise((resolve, reject) => {
        const ffprobe = (0, child_process_1.spawn)("ffprobe", [
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            inputPath,
        ]);
        let output = "";
        ffprobe.stdout.on("data", (data) => {
            output += data.toString();
        });
        ffprobe.stderr.on("data", () => { }); // Consume stderr to prevent blocking
        ffprobe.on("close", (code) => {
            if (code === 0) {
                resolve(parseFloat(output.trim()));
            }
            else {
                reject(new Error(`ffprobe exited with code ${code}`));
            }
        });
        ffprobe.on("error", reject);
    });
}
async function getVideoResolution(inputPath) {
    return new Promise((resolve, reject) => {
        const ffprobe = (0, child_process_1.spawn)("ffprobe", [
            "-v", "error",
            "-select_streams", "v:0",
            "-show_entries", "stream=width,height",
            "-of", "csv=s=x:p=0",
            inputPath,
        ]);
        let output = "";
        ffprobe.stdout.on("data", (data) => {
            output += data.toString();
        });
        ffprobe.stderr.on("data", () => { }); // Consume stderr to prevent blocking
        ffprobe.on("close", (code) => {
            if (code === 0) {
                const [width, height] = output.trim().split("x").map(Number);
                resolve({ width, height });
            }
            else {
                reject(new Error(`ffprobe exited with code ${code}`));
            }
        });
        ffprobe.on("error", reject);
    });
}
async function generateThumbnail(inputPath, outputPath) {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    return new Promise((resolve, reject) => {
        const ffmpeg = (0, child_process_1.spawn)("ffmpeg", [
            "-i", inputPath,
            "-ss", "00:00:01",
            "-vframes", "1",
            "-vf", "scale=640:-1",
            "-y",
            outputPath,
        ]);
        // IMPORTANT: Must consume stdout/stderr to prevent buffer blocking
        ffmpeg.stdout.on("data", () => { });
        ffmpeg.stderr.on("data", () => { });
        ffmpeg.on("close", (code) => {
            if (code === 0) {
                resolve();
            }
            else {
                reject(new Error(`ffmpeg thumbnail generation failed with code ${code}`));
            }
        });
        ffmpeg.on("error", reject);
    });
}
async function transcodeToHLS(inputPath, outputDir, onProgress) {
    // Get video info
    const duration = await getVideoDuration(inputPath);
    const { width: sourceWidth, height: sourceHeight } = await getVideoResolution(inputPath);
    // Create output directory
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    // Filter resolutions based on source video
    const applicableResolutions = config_1.config.resolutions.filter((res) => res.height <= sourceHeight);
    // Always include at least one resolution
    if (applicableResolutions.length === 0) {
        applicableResolutions.push(config_1.config.resolutions[0]);
    }
    // Generate thumbnail
    const thumbnailPath = path.join(outputDir, "poster.jpg");
    await generateThumbnail(inputPath, thumbnailPath);
    // Build FFmpeg command for HLS with Vimeo-like compression
    const { encoding } = config_1.config;
    const ffmpegArgs = [
        "-i", inputPath,
        "-preset", encoding.preset,
        "-profile:v", encoding.profile,
        "-tune", encoding.tune,
        "-g", "48",
        "-keyint_min", "48",
        "-sc_threshold", "0",
        "-hls_time", "4",
        "-hls_playlist_type", "vod",
    ];
    // Add filter complex for multiple resolutions
    let filterComplex = "";
    const varStreamMap = [];
    applicableResolutions.forEach((res, index) => {
        // Scale with force_original_aspect_ratio, then ensure dimensions are divisible by 2
        filterComplex += `[0:v]scale=w=${res.width}:h=${res.height}:force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2[v${index}];`;
        varStreamMap.push(`v:${index},a:${index}`);
        // CRF-based encoding for much better compression
        ffmpegArgs.push("-map", `[v${index}]`, "-map", "0:a?", `-c:v:${index}`, "libx264", `-crf:v:${index}`, String(res.crf), `-maxrate:v:${index}`, res.maxrate, `-bufsize:v:${index}`, res.bufsize, `-c:a:${index}`, "aac", `-b:a:${index}`, encoding.audioBitrate);
    });
    // Insert filter_complex after -i input (at index 2)
    ffmpegArgs.splice(2, 0, "-filter_complex", filterComplex.slice(0, -1));
    ffmpegArgs.push("-var_stream_map", varStreamMap.join(" "), "-master_pl_name", "master.m3u8", "-hls_segment_filename", path.join(outputDir, "v%v/segment%d.ts"), "-y", path.join(outputDir, "v%v/playlist.m3u8"));
    return new Promise((resolve, reject) => {
        const ffmpeg = (0, child_process_1.spawn)("ffmpeg", ffmpegArgs);
        // IMPORTANT: Must consume stdout to prevent buffer blocking
        ffmpeg.stdout.on("data", () => { });
        let stderr = "";
        ffmpeg.stderr.on("data", (data) => {
            stderr += data.toString();
            // Parse progress from FFmpeg output
            const timeMatch = stderr.match(/time=(\d{2}):(\d{2}):(\d{2})/);
            if (timeMatch) {
                const hours = parseInt(timeMatch[1]);
                const minutes = parseInt(timeMatch[2]);
                const seconds = parseInt(timeMatch[3]);
                const currentTime = hours * 3600 + minutes * 60 + seconds;
                const progress = Math.min(95, Math.round((currentTime / duration) * 100));
                onProgress(progress);
            }
        });
        ffmpeg.on("close", (code) => {
            if (code === 0) {
                onProgress(95);
                resolve({
                    duration,
                    outputDir,
                    thumbnailPath,
                });
            }
            else {
                reject(new Error(`FFmpeg exited with code ${code}: ${stderr}`));
            }
        });
        ffmpeg.on("error", reject);
    });
}
function cleanupTempFiles(dir) {
    if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
}
