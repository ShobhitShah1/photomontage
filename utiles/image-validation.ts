/**
 * Image validation and optimization utilities
 * Centralized functions for image size checks and filtering
 */

import * as ImageManipulator from "expo-image-manipulator";
import type { ImagePickerAsset } from "expo-image-picker";
import { Alert } from "react-native";

/**
 * Maximum allowed image dimension (width or height) in pixels
 */
export const MAX_IMAGE_DIMENSION = 2500;

/**
 * Maximum allowed total pixels (megapixels * 1,000,000)
 * 5MP = 5,000,000 pixels (e.g., ~2200x2200)
 */
export const MAX_IMAGE_PIXELS = 5_000_000;

/**
 * Maximum megapixels as a human-readable number
 */
export const MAX_IMAGE_MEGAPIXELS = 5;

/**
 * Maximum file size in bytes (5 MB)
 */
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

/**
 * Minimal image info interface for validation
 */
export interface ImageInfo {
  width: number;
  height: number;
  uri?: string;
}

/**
 * Result of image validation
 */
export interface ImageValidationResult {
  isValid: boolean;
  reason?:
    | "invalid_dimensions"
    | "too_large"
    | "exceeds_dimension"
    | "exceeds_megapixels";
  width: number;
  height: number;
  megapixels: number;
}

/**
 * Result of filtering multiple images
 */
export interface ImageFilterResult<T> {
  validImages: T[];
  invalidImages: T[];
  invalidCount: number;
  hasInvalid: boolean;
}

/**
 * Check if a single image meets size requirements
 * @param image - Image info with width and height
 * @returns Validation result with details
 */
export function validateImageSize(image: ImageInfo): ImageValidationResult {
  const width = image.width ?? 0;
  const height = image.height ?? 0;
  const megapixels = (width * height) / 1_000_000;

  // Check for invalid dimensions
  if (width <= 0 || height <= 0) {
    return {
      isValid: false,
      reason: "invalid_dimensions",
      width,
      height,
      megapixels,
    };
  }

  // Check dimension limits
  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    return {
      isValid: false,
      reason: "exceeds_dimension",
      width,
      height,
      megapixels,
    };
  }

  // Check megapixel limit
  if (width * height > MAX_IMAGE_PIXELS) {
    return {
      isValid: false,
      reason: "exceeds_megapixels",
      width,
      height,
      megapixels,
    };
  }

  return {
    isValid: true,
    width,
    height,
    megapixels,
  };
}

/**
 * Check if an image is too large (quick boolean check)
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @returns true if image exceeds size limits
 */
export function isImageTooLarge(width: number, height: number): boolean {
  return (
    width > MAX_IMAGE_DIMENSION ||
    height > MAX_IMAGE_DIMENSION ||
    width * height > MAX_IMAGE_PIXELS
  );
}

/**
 * Check if an image has valid dimensions
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @returns true if dimensions are valid (positive numbers)
 */
export function hasValidDimensions(width: number, height: number): boolean {
  return (
    width > 0 && height > 0 && Number.isFinite(width) && Number.isFinite(height)
  );
}

/**
 * Filter an array of images, removing those that exceed size limits
 * @param images - Array of images with width/height properties
 * @returns Object with valid images, invalid images, and count
 */
export function filterImagesBySize<T extends ImageInfo>(
  images: T[]
): ImageFilterResult<T> {
  const validImages: T[] = [];
  const invalidImages: T[] = [];

  for (const image of images) {
    const result = validateImageSize(image);
    if (result.isValid) {
      validImages.push(image);
    } else {
      invalidImages.push(image);
    }
  }

  return {
    validImages,
    invalidImages,
    invalidCount: invalidImages.length,
    hasInvalid: invalidImages.length > 0,
  };
}

/**
 * Filter ImagePickerAssets specifically (expo-image-picker results)
 * @param assets - Array of ImagePickerAsset from expo-image-picker
 * @returns Object with valid and invalid assets
 */
export function filterPickerAssets(
  assets: ImagePickerAsset[]
): ImageFilterResult<ImagePickerAsset> {
  const validImages: ImagePickerAsset[] = [];
  const invalidImages: ImagePickerAsset[] = [];

  for (const asset of assets) {
    const width = asset.width ?? 0;
    const height = asset.height ?? 0;

    if (!hasValidDimensions(width, height) || isImageTooLarge(width, height)) {
      invalidImages.push(asset);
    } else {
      validImages.push(asset);
    }
  }

  return {
    validImages,
    invalidImages,
    invalidCount: invalidImages.length,
    hasInvalid: invalidImages.length > 0,
  };
}

/**
 * Show an alert for oversized images
 * @param count - Number of images that were too large
 * @param showIfZero - Whether to show alert even if count is 0 (default: false)
 */
export function showOversizedImageAlert(
  count: number,
  showIfZero = false
): void {
  if (count === 0 && !showIfZero) return;

  const message =
    count === 1
      ? "1 image exceeded the 5MP limit and was skipped. use smaller images."
      : `${count} images exceeded the 5MP limit and were skipped. use smaller images.`;

  Alert.alert("Image Too Large", message);
}

/**
 * Show an alert when all images are invalid
 */
export function showAllImagesInvalidAlert(): void {
  Alert.alert(
    "No Valid Images",
    "All selected images exceed the 5MP or 2500px limit. Please select smaller images."
  );
}

/**
 * Show an alert for invalid image dimensions
 */
export function showInvalidDimensionsAlert(): void {
  Alert.alert(
    "Invalid Images",
    "Selected images have invalid dimensions. Please try different images."
  );
}

/**
 * Filter images and show appropriate alerts
 * Convenience function that combines filtering and alert display
 * @param assets - Array of ImagePickerAsset
 * @returns Valid assets only (invalid ones are filtered and alert is shown)
 */
export function filterAssetsWithAlert(
  assets: ImagePickerAsset[]
): ImagePickerAsset[] {
  const { validImages, invalidCount, hasInvalid } = filterPickerAssets(assets);

  if (hasInvalid) {
    showOversizedImageAlert(invalidCount);
  }

  return validImages;
}

/**
 * Get human-readable size info for an image
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @returns Formatted string like "1920x1080 (2.1MP)"
 */
export function getImageSizeInfo(width: number, height: number): string {
  const megapixels = (width * height) / 1_000_000;
  return `${width}x${height} (${megapixels.toFixed(1)}MP)`;
}

/**
 * Log image info for debugging
 * @param label - Label for the log
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 */
export function logImageSize(
  label: string,
  width: number,
  height: number
): void {
  const megapixels = (width * height) / 1_000_000;
  const isTooLarge = isImageTooLarge(width, height);

  if (isTooLarge) {
    console.warn(
      `[PERF] ${label}: Large image detected! ${getImageSizeInfo(width, height)}`
    );
  }
}

/**
 * Process a single image: validate and compress if necessary
 * Checks for both file size (>5MB) and dimensions (>2500px or >5MP)
 */
export async function processImageForUpload(
  asset: ImagePickerAsset
): Promise<ImagePickerAsset> {
  const { width, height, fileSize, uri } = asset;

  // If no size info or URI, return as is
  if (!uri) return asset;

  const currentSize = fileSize ?? 0;
  const isTooLargeMb = currentSize > MAX_FILE_SIZE_BYTES;
  const isTooLargeDims = isImageTooLarge(width, height);

  if (!isTooLargeMb && !isTooLargeDims) {
    return asset;
  }

  // Calculate target dims
  let targetWidth = width;
  let targetHeight = height;

  if (isTooLargeDims) {
    const aspectRatio = width / height;
    if (width > height) {
      targetWidth = MAX_IMAGE_DIMENSION;
      targetHeight = Math.round(MAX_IMAGE_DIMENSION / aspectRatio);
    } else {
      targetHeight = MAX_IMAGE_DIMENSION;
      targetWidth = Math.round(MAX_IMAGE_DIMENSION * aspectRatio);
    }
  }

  // Compress
  try {
    const actions: ImageManipulator.Action[] = [];

    if (isTooLargeDims) {
      actions.push({ resize: { width: targetWidth, height: targetHeight } });
    }

    const result = await ImageManipulator.manipulateAsync(uri, actions, {
      compress: 0.7, // Compress to ensure < 5MB if it was large
      format: ImageManipulator.SaveFormat.JPEG,
    });

    return {
      ...asset,
      uri: result.uri,
      width: result.width,
      height: result.height,
      // We assume the file size is now valid or significantly reduced
    };
  } catch (error) {
    console.warn("Image compression failed", error);
    return asset;
  }
}

/**
 * Process multiple images for upload
 * Validates and compresses any images that exceed limits
 */
export async function processImages(
  assets: ImagePickerAsset[]
): Promise<ImagePickerAsset[]> {
  return Promise.all(assets.map((asset) => processImageForUpload(asset)));
}
