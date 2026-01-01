import Groq from "groq-sdk";
import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

interface TranscriptionResult {
  text: string;
  vtt: string;
  segments: TranscriptSegment[];
  language: string;
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Extract audio from video for transcription
async function extractAudio(videoPath: string): Promise<string> {
  const audioPath = videoPath.replace(/\.[^.]+$/, ".mp3");

  // Extract audio as mp3 (Groq supports mp3, mp4, mpeg, mpga, m4a, wav, webm)
  // Use 16kHz mono for optimal speech recognition
  await execAsync(
    `ffmpeg -i "${videoPath}" -vn -acodec libmp3lame -ar 16000 -ac 1 -b:a 64k "${audioPath}" -y`
  );

  return audioPath;
}

// Convert Groq response to VTT format
function segmentsToVTT(segments: TranscriptSegment[]): string {
  let vtt = "WEBVTT\n\n";

  segments.forEach((segment, index) => {
    const startTime = formatVTTTime(segment.start);
    const endTime = formatVTTTime(segment.end);
    vtt += `${index + 1}\n${startTime} --> ${endTime}\n${segment.text}\n\n`;
  });

  return vtt;
}

function formatVTTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
}

export async function transcribeVideo(videoPath: string): Promise<TranscriptionResult | null> {
  if (!process.env.GROQ_API_KEY) {
    console.log("   GROQ_API_KEY not set, skipping transcription");
    return null;
  }

  try {
    console.log("   Extracting audio for transcription...");
    const audioPath = await extractAudio(videoPath);

    // Check file size - Groq has 25MB limit
    const stats = fs.statSync(audioPath);
    const fileSizeMB = stats.size / (1024 * 1024);

    if (fileSizeMB > 25) {
      console.log(`   Audio file too large (${fileSizeMB.toFixed(1)}MB > 25MB), skipping transcription`);
      fs.unlinkSync(audioPath);
      return null;
    }

    console.log(`   Sending to Groq Whisper (${fileSizeMB.toFixed(1)}MB)...`);

    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: "whisper-large-v3",
      response_format: "verbose_json",
      timestamp_granularities: ["segment"],
    });

    // Clean up audio file
    fs.unlinkSync(audioPath);

    // Parse segments from response
    const segments: TranscriptSegment[] = (transcription as any).segments?.map((seg: any) => ({
      start: seg.start,
      end: seg.end,
      text: seg.text.trim(),
    })) || [];

    const result: TranscriptionResult = {
      text: transcription.text,
      vtt: segmentsToVTT(segments),
      segments,
      language: (transcription as any).language || "en",
    };

    console.log(`   Transcription complete: ${result.text.length} chars, ${segments.length} segments`);

    return result;
  } catch (error) {
    console.error("   Transcription error:", error);
    return null;
  }
}
