import { PreviewImage } from "@/components/preview/preview-image";
import { FontFamily } from "@/constants/fonts";
import { useTheme } from "@/context/theme-context";
import { useSelectionStore } from "@/store/selection-store";
import { generateStackedLayout, ImageLayout } from "@/utiles/preview-layout";
import { colors, radii, spacing } from "@/utiles/tokens";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ImageWithDimensions {
  id: string;
  uri: string;
  width: number;
  height: number;
}

export default function PreviewScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const images = useSelectionStore((state) => state.images);

  useEffect(() => {
    router.prefetch("/editor");
  }, []);

  const handleBack = useCallback((): void => {
    router.back();
  }, [router]);

  const handleContinue = useCallback((): void => {
    if (images.length === 0) {
      return;
    }

    router.replace("/editor");
  }, [images.length, router]);

  const imagesWithDimensions = useMemo((): ImageWithDimensions[] => {
    return images.map((img) => ({
      id: img.id,
      uri: img.uri,
      width: img.width || 300,
      height: img.height || 300,
    }));
  }, [images]);

  const canvasWidth = screenWidth;
  const canvasHeight = screenHeight - 140;

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
              <PreviewImage
                key={image.id}
                uri={image.uri}
                width={layout.width}
                height={layout.height}
                rotation={layout.rotation}
                zIndex={layout.zIndex}
                x={layout.x}
                y={layout.y}
              />
            );
          })}
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Pressable onPress={handleContinue} style={styles.primaryButton}>
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
    overflow: "hidden",
  },
  buttonContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    alignItems: "center",
  },
  primaryButton: {
    width: "50%",
    backgroundColor: "#FFD700",
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  primaryButtonText: {
    color: "#0B0B0C",
    fontSize: 17,
    fontFamily: FontFamily.bold,
  },
  backButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
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
    fontFamily: FontFamily.bold,
    marginBottom: 3,
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 10,
  },
});
