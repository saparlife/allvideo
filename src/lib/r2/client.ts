import { S3Client } from "@aws-sdk/client-s3";

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export const R2_BUCKET = process.env.R2_BUCKET!.trim();
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!.trim();

// Fix URLs that might have old CDN domains stored in database
export function fixCdnUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  // Extract path from URL and prepend current CDN
  const urlPath = url.replace(/^https?:\/\/[^/]+/, '');
  return `${R2_PUBLIC_URL}${urlPath}`;
}

// Fix variant URLs object
export function fixVariantUrls(variants: Record<string, { url: string; [key: string]: unknown }> | undefined): Record<string, { url: string; [key: string]: unknown }> {
  if (!variants) return {};
  return Object.fromEntries(
    Object.entries(variants).map(([name, variant]) => [
      name,
      { ...variant, url: fixCdnUrl(variant.url) || variant.url }
    ])
  );
}
