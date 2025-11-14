import { useTheme } from "@/context/theme-context";
import { colors, radii, spacing } from "@/src/theme/tokens";
import { useSelectionStore } from "@/store/selection-store";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ImageLayout {
  x: number;
  y: number;
  rotation: number;
  zIndex: number;
  width: number;
  height: number;
}

interface ImageWithDimensions {
  id: string;
  uri: string;
  width: number;
  height: number;
}

const seededRandom = (seed: number): number => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

const checkOverlap = (
  x1: number,
  y1: number,
  w1: number,
  h1: number,
  x2: number,
  y2: number,
  w2: number,
  h2: number,
  minGap: number
): boolean => {
  return !(
    x1 + w1 + minGap < x2 ||
    x2 + w2 + minGap < x1 ||
    y1 + h1 + minGap < y2 ||
    y2 + h2 + minGap < y1
  );
};

const generateStackedLayout = (
  images: ImageWithDimensions[],
  canvasWidth: number,
  canvasHeight: number
): ImageLayout[] => {
  const layouts: ImageLayout[] = [];
  const targetImageSize = Math.min(canvasWidth, canvasHeight) * 0.45;
  const minGap = 40;
  const maxAttempts = 100;

  images.forEach((image, i) => {
    const seed = image.id
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);

    // Calculate aspect ratio and resize to target size
    const aspectRatio = image.width / image.height;
    let imgWidth: number;
    let imgHeight: number;

    if (aspectRatio > 1) {
      imgWidth = targetImageSize;
      imgHeight = targetImageSize / aspectRatio;
    } else {
      imgHeight = targetImageSize;
      imgWidth = targetImageSize * aspectRatio;
    }

    let x = 0;
    let y = 0;
    let rotation = 0;
    let foundPosition = false;

    // Try to find a non-overlapping position
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const r1 = seededRandom(seed + i * 7 + attempt * 3);
      const r2 = seededRandom(seed + i * 11 + attempt * 5);
      const r3 = seededRandom(seed + i * 13 + attempt * 7);

      const safeWidth = canvasWidth - imgWidth - minGap * 2;
      const safeHeight = canvasHeight - imgHeight - minGap * 2;

      x = minGap + r1 * safeWidth;
      y = minGap + r2 * safeHeight;
      rotation = (r3 - 0.5) * 25;

      // Check if this position overlaps with existing images
      let hasOverlap = false;
      for (const existingLayout of layouts) {
        if (
          checkOverlap(
            x,
            y,
            imgWidth,
            imgHeight,
            existingLayout.x,
            existingLayout.y,
            existingLayout.width,
            existingLayout.height,
            minGap
          )
        ) {
          hasOverlap = true;
          break;
        }
      }

      if (!hasOverlap) {
        foundPosition = true;
        break;
      }
    }

    // If no position found after max attempts, place it anyway (fallback)
    if (!foundPosition) {
      const r1 = seededRandom(seed + i * 7);
      const r2 = seededRandom(seed + i * 11);
      const r3 = seededRandom(seed + i * 13);

      x = minGap + r1 * (canvasWidth - imgWidth - minGap * 2);
      y = minGap + r2 * (canvasHeight - imgHeight - minGap * 2);
      rotation = (r3 - 0.5) * 25;
    }

    layouts.push({
      x,
      y,
      rotation,
      zIndex: i,
      width: imgWidth,
      height: imgHeight,
    });
  });

  return layouts;
};

export default function PreviewScreen(): JSX.Element {
  const router = useRouter();
  const { theme } = useTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const images = useSelectionStore((state) => state.images);

  const handleBack = useCallback((): void => {
    router.back();
  }, [router]);

  const handleContinue = useCallback((): void => {
    if (images.length === 0) {
      return;
    }
    router.push("/editor");
  }, [images.length, router]);

  // Get image dimensions from the store
  const imagesWithDimensions = useMemo((): ImageWithDimensions[] => {
    return images.map((img) => ({
      id: img.id,
      uri: img.uri,
      width: img.width || 300,
      height: img.height || 300,
    }));
  }, [images]);

  const canvasWidth = screenWidth;
  const canvasHeight = screenHeight - 120;

  const layouts = useMemo((): ImageLayout[] => {
    if (imagesWithDimensions.length === 0) return [];
    return generateStackedLayout(
      imagesWithDimensions,
      canvasWidth,
      canvasHeight
    );
  }, [imagesWithDimensions, canvasWidth, canvasHeight]);

  if (images.length === 0) {
    return (
      <SafeAreaView style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Add some photos</Text>
        <Text style={styles.emptySubtitle}>
          Use the upload button to pick images before editing.
        </Text>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.content}>
        <View
          style={[styles.canvas, { width: canvasWidth, height: canvasHeight }]}
        >
          {imagesWithDimensions.map((image, index) => {
            const layout = layouts[index];
            if (!layout) return null;

            return (
              <View
                key={image.id}
                style={[
                  styles.imageContainer,
                  {
                    left: layout.x,
                    top: layout.y,
                    width: layout.width,
                    height: layout.height,
                    transform: [{ rotate: `${layout.rotation}deg` }],
                    zIndex: layout.zIndex,
                  },
                ]}
              >
                <Image
                  source={{ uri: image.uri }}
                  style={styles.previewImage}
                  contentFit="cover"
                />
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Pressable
          onPress={handleContinue}
          style={[styles.primaryButton, { backgroundColor: theme.primary }]}
        >
          <Text style={styles.primaryButtonText}>Let&apos;s Go</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  canvas: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.bg,
    position: "relative",
    overflow: "visible",
  },
  imageContainer: {
    position: "absolute",
    borderRadius: radii.md,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  buttonContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    alignItems: "center",
  },
  primaryButton: {
    width: "50%",
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#0B0B0C",
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backButtonText: {
    color: colors.text,
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "600",
    marginBottom: spacing.md,
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
});
