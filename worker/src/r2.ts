import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { config } from "./config";
import * as fs from "fs";
import * as path from "path";
import { pipeline } from "stream/promises";
import { Readable } from "stream";

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${config.r2.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: config.r2.accessKeyId,
    secretAccessKey: config.r2.secretAccessKey,
  },
});

export async function downloadFile(key: string, localPath: string): Promise<void> {
  const dir = path.dirname(localPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const command = new GetObjectCommand({
    Bucket: config.r2.bucket,
    Key: key,
  });

  const response = await r2Client.send(command);

  if (!response.Body) {
    throw new Error("Empty response body");
  }

  const writeStream = fs.createWriteStream(localPath);
  await pipeline(response.Body as Readable, writeStream);
}

export async function uploadFile(localPath: string, key: string, contentType: string): Promise<void> {
  const fileContent = fs.readFileSync(localPath);

  const command = new PutObjectCommand({
    Bucket: config.r2.bucket,
    Key: key,
    Body: fileContent,
    ContentType: contentType,
  });

  await r2Client.send(command);
}

export async function uploadDirectory(localDir: string, r2Prefix: string): Promise<void> {
  const files = getAllFiles(localDir);

  for (const file of files) {
    const relativePath = path.relative(localDir, file);
    const r2Key = `${r2Prefix}/${relativePath}`;

    let contentType = "application/octet-stream";
    if (file.endsWith(".m3u8")) {
      contentType = "application/vnd.apple.mpegurl";
    } else if (file.endsWith(".ts")) {
      contentType = "video/MP2T";
    } else if (file.endsWith(".jpg") || file.endsWith(".jpeg")) {
      contentType = "image/jpeg";
    } else if (file.endsWith(".png")) {
      contentType = "image/png";
    }

    await uploadFile(file, r2Key, contentType);
  }
}

function getAllFiles(dir: string): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

export async function fileExists(key: string): Promise<boolean> {
  try {
    await r2Client.send(
      new HeadObjectCommand({
        Bucket: config.r2.bucket,
        Key: key,
      })
    );
    return true;
  } catch {
    return false;
  }
}

export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: config.r2.bucket,
    Key: key,
  });
  await r2Client.send(command);
}
