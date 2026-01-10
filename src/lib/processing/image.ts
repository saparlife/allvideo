import sharp from "sharp";

export interface ImageVariant {
  name: string;
  width: number;
  height?: number;
  fit?: "cover" | "contain" | "fill" | "inside" | "outside";
}

export interface ProcessedVariant {
  name: string;
  buffer: Buffer;
  width: number;
  height: number;
  size: number;
  format: string;
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
  hasAlpha: boolean;
  dominantColor?: string;
}

// Default variants for image processing
export const DEFAULT_VARIANTS: ImageVariant[] = [
  { name: "thumbnail", width: 150, height: 150, fit: "cover" },
  { name: "small", width: 320 },
  { name: "medium", width: 800 },
  { name: "large", width: 1920 },
];

// Preset configurations
export const PRESETS: Record<string, ImageVariant[]> = {
  avatar: [
    { name: "small", width: 64, height: 64, fit: "cover" },
    { name: "medium", width: 128, height: 128, fit: "cover" },
    { name: "large", width: 256, height: 256, fit: "cover" },
  ],
  product: [
    { name: "thumbnail", width: 200, height: 200, fit: "contain" },
    { name: "medium", width: 600 },
    { name: "large", width: 1200 },
  ],
  banner: [
    { name: "mobile", width: 640, height: 320, fit: "cover" },
    { name: "tablet", width: 1024, height: 400, fit: "cover" },
    { name: "desktop", width: 1920, height: 600, fit: "cover" },
  ],
};

/**
 * Get image metadata
 */
export async function getImageMetadata(buffer: Buffer): Promise<ImageMetadata> {
  const image = sharp(buffer);
  const metadata = await image.metadata();
  const stats = await image.stats();

  // Get dominant color from stats
  const dominantChannel = stats.dominant;
  const dominantColor = `rgb(${Math.round(dominantChannel.r)},${Math.round(dominantChannel.g)},${Math.round(dominantChannel.b)})`;

  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format || "unknown",
    size: buffer.length,
    hasAlpha: metadata.hasAlpha || false,
    dominantColor,
  };
}

/**
 * Process image into multiple variants
 */
export async function processImage(
  buffer: Buffer,
  variants: ImageVariant[] = DEFAULT_VARIANTS,
  outputFormat: "webp" | "jpeg" | "png" | "avif" = "webp",
  quality: number = 80
): Promise<ProcessedVariant[]> {
  const results: ProcessedVariant[] = [];

  for (const variant of variants) {
    let image = sharp(buffer);

    // Resize
    if (variant.height) {
      image = image.resize(variant.width, variant.height, {
        fit: variant.fit || "cover",
        withoutEnlargement: true,
      });
    } else {
      image = image.resize(variant.width, undefined, {
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    // Convert to output format
    switch (outputFormat) {
      case "webp":
        image = image.webp({ quality });
        break;
      case "jpeg":
        image = image.jpeg({ quality });
        break;
      case "png":
        image = image.png({ quality });
        break;
      case "avif":
        image = image.avif({ quality });
        break;
    }

    const outputBuffer = await image.toBuffer();
    const outputMetadata = await sharp(outputBuffer).metadata();

    results.push({
      name: variant.name,
      buffer: outputBuffer,
      width: outputMetadata.width || variant.width,
      height: outputMetadata.height || 0,
      size: outputBuffer.length,
      format: outputFormat,
    });
  }

  return results;
}

/**
 * Parse variants from query string
 * e.g., "thumbnail,medium,large" or "avatar" (preset)
 */
export function parseVariants(variantsParam: string | null): ImageVariant[] {
  if (!variantsParam) {
    return DEFAULT_VARIANTS;
  }

  // Check if it's a preset
  if (PRESETS[variantsParam]) {
    return PRESETS[variantsParam];
  }

  // Parse comma-separated variant names
  const names = variantsParam.split(",").map((s) => s.trim());
  return DEFAULT_VARIANTS.filter((v) => names.includes(v.name));
}
