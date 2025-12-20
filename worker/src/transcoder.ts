import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { config } from "./config";

interface TranscodeResult {
  duration: number;
  outputDir: string;
  thumbnailPath: string;
}

export async function getVideoDuration(inputPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn("ffprobe", [
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1",
      inputPath,
    ]);

    let output = "";
    ffprobe.stdout.on("data", (data) => {
      output += data.toString();
    });

    ffprobe.on("close", (code) => {
      if (code === 0) {
        resolve(parseFloat(output.trim()));
      } else {
        reject(new Error(`ffprobe exited with code ${code}`));
      }
    });

    ffprobe.on("error", reject);
  });
}

export async function getVideoResolution(inputPath: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn("ffprobe", [
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

    ffprobe.on("close", (code) => {
      if (code === 0) {
        const [width, height] = output.trim().split("x").map(Number);
        resolve({ width, height });
      } else {
        reject(new Error(`ffprobe exited with code ${code}`));
      }
    });

    ffprobe.on("error", reject);
  });
}

export async function generateThumbnail(inputPath: string, outputPath: string): Promise<void> {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-i", inputPath,
      "-ss", "00:00:01",
      "-vframes", "1",
      "-vf", "scale=640:-1",
      "-y",
      outputPath,
    ]);

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`ffmpeg thumbnail generation failed with code ${code}`));
      }
    });

    ffmpeg.on("error", reject);
  });
}

export async function transcodeToHLS(
  inputPath: string,
  outputDir: string,
  onProgress: (progress: number) => void
): Promise<TranscodeResult> {
  // Get video info
  const duration = await getVideoDuration(inputPath);
  const { width: sourceWidth, height: sourceHeight } = await getVideoResolution(inputPath);

  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Filter resolutions based on source video
  const applicableResolutions = config.resolutions.filter(
    (res) => res.height <= sourceHeight
  );

  // Always include at least one resolution
  if (applicableResolutions.length === 0) {
    applicableResolutions.push(config.resolutions[0]);
  }

  // Generate thumbnail
  const thumbnailPath = path.join(outputDir, "poster.jpg");
  await generateThumbnail(inputPath, thumbnailPath);

  // Build FFmpeg command for HLS
  const ffmpegArgs = [
    "-i", inputPath,
    "-preset", "fast",
    "-g", "48",
    "-keyint_min", "48",
    "-sc_threshold", "0",
    "-hls_time", "4",
    "-hls_playlist_type", "vod",
  ];

  // Add filter complex for multiple resolutions
  let filterComplex = "";
  const varStreamMap: string[] = [];

  applicableResolutions.forEach((res, index) => {
    filterComplex += `[0:v]scale=w=${res.width}:h=${res.height}:force_original_aspect_ratio=decrease[v${index}];`;
    varStreamMap.push(`v:${index},a:${index}`);

    ffmpegArgs.push(
      "-map", `[v${index}]`,
      "-map", "0:a?",
      `-c:v:${index}`, "libx264",
      `-b:v:${index}`, res.bitrate,
      `-c:a:${index}`, "aac",
      `-b:a:${index}`, "128k"
    );
  });

  ffmpegArgs.unshift("-filter_complex", filterComplex.slice(0, -1));

  ffmpegArgs.push(
    "-var_stream_map", varStreamMap.join(" "),
    "-master_pl_name", "master.m3u8",
    "-hls_segment_filename", path.join(outputDir, "v%v/segment%d.ts"),
    "-y",
    path.join(outputDir, "v%v/playlist.m3u8")
  );

  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", ffmpegArgs);

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
      } else {
        reject(new Error(`FFmpeg exited with code ${code}: ${stderr}`));
      }
    });

    ffmpeg.on("error", reject);
  });
}

export function cleanupTempFiles(dir: string): void {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
