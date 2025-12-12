/**
 * Image optimization utilities for performance
 */

/**
 * Calculate optimal display dimensions for an image.
 * Limits image rendering to a maximum size to improve performance
 * while maintaining aspect ratio.
 *
 * @param originalWidth - Original image width in pixels
 * @param originalHeight - Original image height in pixels
 * @param maxWidth - Maximum display width
 * @param maxHeight - Maximum display height
 * @returns Optimized dimensions and scale factor
 */
export function getOptimalDisplaySize(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number; scale: number } {
  if (originalWidth <= 0 || originalHeight <= 0) {
    return { width: 0, height: 0, scale: 1 };
  }

  const widthRatio = maxWidth / originalWidth;
  const heightRatio = maxHeight / originalHeight;
  const scale = Math.min(widthRatio, heightRatio, 1);

  return {
    width: Math.round(originalWidth * scale),
    height: Math.round(originalHeight * scale),
    scale,
  };
}

/**
 * Check if an image exceeds recommended size thresholds.
 * Large images (>4K resolution) can cause performance issues.
 *
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @returns Object with size warnings
 */
export function checkImagePerformance(
  width: number,
  height: number
): {
  isLarge: boolean;
  isVeryLarge: boolean;
  totalPixels: number;
  recommendation: string | null;
} {
  const totalPixels = width * height;
  const HD = 1920 * 1080; // ~2 million pixels
  const FOUR_K = 3840 * 2160; // ~8 million pixels
  const EIGHT_K = 7680 * 4320; // ~33 million pixels

  const isLarge = totalPixels > FOUR_K;
  const isVeryLarge = totalPixels > EIGHT_K;

  let recommendation: string | null = null;
  if (isVeryLarge) {
    recommendation = `Image is very large (${Math.round(totalPixels / 1000000)}MP). Consider downscaling to improve performance.`;
  } else if (isLarge) {
    recommendation = `Image is large (${Math.round(totalPixels / 1000000)}MP). Performance may be affected during transforms.`;
  }

  return {
    isLarge,
    isVeryLarge,
    totalPixels,
    recommendation,
  };
}

/**
 * Calculate the maximum texture size based on platform limits.
 * Different devices have different maximum texture sizes.
 *
 * @returns Maximum recommended texture dimension in pixels
 */
export function getMaxTextureSize(): number {
  // Conservative limit that works on most devices
  // Most modern devices support at least 4096x4096, some up to 16384x16384
  // We use 4096 as a safe default for performance
  return 4096;
}

/**
 * Clamp dimensions to stay within texture size limits
 */
export function clampToTextureSize(
  width: number,
  height: number,
  maxSize: number = getMaxTextureSize()
): { width: number; height: number; wasClipped: boolean } {
  if (width <= maxSize && height <= maxSize) {
    return { width, height, wasClipped: false };
  }

  const ratio = Math.min(maxSize / width, maxSize / height);
  return {
    width: Math.floor(width * ratio),
    height: Math.floor(height * ratio),
    wasClipped: true,
  };
}
