/**
 * File validation utilities
 */

import { transliterate } from "transliteration";

// Max file sizes by subscription tier (in bytes)
export const MAX_FILE_SIZES = {
  free: 500 * 1024 * 1024,      // 500 MB
  starter: 2 * 1024 * 1024 * 1024,  // 2 GB
  pro: 5 * 1024 * 1024 * 1024,      // 5 GB
  business: 10 * 1024 * 1024 * 1024, // 10 GB
  scale: 10 * 1024 * 1024 * 1024,    // 10 GB
  enterprise: 50 * 1024 * 1024 * 1024, // 50 GB
  enterprise_plus: 50 * 1024 * 1024 * 1024, // 50 GB
  ultimate: 100 * 1024 * 1024 * 1024, // 100 GB
} as const;

export type SubscriptionTier = keyof typeof MAX_FILE_SIZES;

/**
 * Sanitize filename to prevent security issues
 * - Transliterates non-Latin characters to ASCII
 * - Removes path traversal attempts (../)
 * - Removes null bytes
 * - Replaces dangerous characters
 * - Limits length
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return "unnamed";

  // Extract extension first
  const ext = getExtension(filename);
  const nameWithoutExt = ext
    ? filename.slice(0, filename.length - ext.length - 1)
    : filename;

  // Transliterate non-Latin characters to ASCII (Russian, Kazakh, Greek, etc.)
  let sanitized = transliterate(nameWithoutExt)
    // Remove null bytes
    .replace(/\0/g, "")
    // Remove path traversal
    .replace(/\.\.\//g, "")
    .replace(/\.\./g, "")
    // Remove leading/trailing dots and spaces
    .replace(/^[\s.]+|[\s.]+$/g, "")
    // Replace path separators
    .replace(/[/\\]/g, "_")
    // Remove control characters and newlines
    .replace(/[\x00-\x1f\x7f\r\n]/g, "")
    // Replace potentially dangerous characters
    .replace(/[<>:"|?*]/g, "_")
    // Replace spaces with hyphens for cleaner URLs
    .replace(/\s+/g, "-")
    // Collapse multiple underscores/hyphens
    .replace(/[-_]+/g, "-")
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, "")
    // Convert to lowercase for consistency
    .toLowerCase();

  // Add extension back
  if (ext) {
    sanitized = `${sanitized}.${ext}`;
  }

  // Limit filename length (255 is common filesystem limit)
  if (sanitized.length > 200) {
    const name = sanitized.slice(0, 200 - ext.length - 1);
    sanitized = ext ? `${name}.${ext}` : name;
  }

  // Fallback if empty after sanitization
  if (!sanitized || sanitized === "-" || sanitized === `.${ext}`) {
    return ext ? `unnamed.${ext}` : "unnamed";
  }

  return sanitized;
}

/**
 * Get file extension
 */
export function getExtension(filename: string): string {
  const parts = filename.split(".");
  if (parts.length < 2) return "";
  return parts[parts.length - 1].toLowerCase();
}

/**
 * Check if file size is within limits for the given tier
 */
export function isFileSizeAllowed(
  sizeBytes: number,
  tier: SubscriptionTier = "free"
): boolean {
  const maxSize = MAX_FILE_SIZES[tier] || MAX_FILE_SIZES.free;
  return sizeBytes <= maxSize;
}

/**
 * Get max file size for tier
 */
export function getMaxFileSize(tier: SubscriptionTier = "free"): number {
  return MAX_FILE_SIZES[tier] || MAX_FILE_SIZES.free;
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

/**
 * Validation result
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
  sanitizedFilename?: string;
}

/**
 * Validate file for upload
 */
export function validateFile(
  filename: string,
  sizeBytes: number,
  tier: SubscriptionTier = "free"
): FileValidationResult {
  // Check size
  const maxSize = getMaxFileSize(tier);
  if (sizeBytes > maxSize) {
    return {
      valid: false,
      error: `File size ${formatBytes(sizeBytes)} exceeds maximum ${formatBytes(maxSize)} for ${tier} tier`,
    };
  }

  // Sanitize filename
  const sanitizedFilename = sanitizeFilename(filename);

  return {
    valid: true,
    sanitizedFilename,
  };
}
