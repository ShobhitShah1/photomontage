import { Image } from "expo-image";
import * as ImageManipulator from "expo-image-manipulator";
import React, { useEffect, useState } from "react";
import { LayoutChangeEvent, Modal, Pressable, Text, View } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { colors, radii, spacing } from "../theme/tokens";

type Aspect = "free" | "1:1" | "3:2" | "4:3" | "16:9";

interface CropperProps {
  visible: boolean;
  uri: string;
  onCancel: () => void;
  onDone: (result: {
    uri: string;
    rect: { x: number; y: number; width: number; height: number };
  }) => void;
}

export const Cropper: React.FC<CropperProps> = ({
  visible,
  uri,
  onCancel,
  onDone,
}) => {
  const [container, setContainer] = useState({ width: 0, height: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const [displayOffset, setDisplayOffset] = useState({ x: 0, y: 0 });
  const [aspect, setAspect] = useState<Aspect>("free");
  const [isReady, setIsReady] = useState(false);

  // Shared values for smooth animations
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const cropWidth = useSharedValue(200);
  const cropHeight = useSharedValue(200);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const startWidth = useSharedValue(200);
  const startHeight = useSharedValue(200);

  useEffect(() => {
    if (visible && uri) {
      loadImageDimensions();
    }
  }, [visible, uri, container.width, container.height]);

  const loadImageDimensions = async () => {
    if (container.width === 0 || container.height === 0) return;

    try {
      // Get image info using ImageManipulator
      const imageInfo = await ImageManipulator.manipulateAsync(uri, [], {});

      if (imageInfo && imageInfo.width && imageInfo.height) {
        setImageSize({ width: imageInfo.width, height: imageInfo.height });
        calculateImageBounds(
          container.width,
          container.height,
          imageInfo.width,
          imageInfo.height
        );
      }
    } catch (error) {
      console.error("Error loading image:", error);
    }
  };

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setContainer({ width, height });
  };

  const calculateImageBounds = (
    containerWidth: number,
    containerHeight: number,
    imgWidth: number,
    imgHeight: number
  ) => {
    const imageAspect = imgWidth / imgHeight;
    const containerAspect = containerWidth / containerHeight;

    let displayWidth, displayHeight, offsetX, offsetY;

    if (imageAspect > containerAspect) {
      displayWidth = containerWidth;
      displayHeight = containerWidth / imageAspect;
      offsetX = 0;
      offsetY = (containerHeight - displayHeight) / 2;
    } else {
      displayHeight = containerHeight;
      displayWidth = containerHeight * imageAspect;
      offsetX = (containerWidth - displayWidth) / 2;
      offsetY = 0;
    }

    setDisplaySize({ width: displayWidth, height: displayHeight });
    setDisplayOffset({ x: offsetX, y: offsetY });

    // Initialize crop rect in center
    const initialSize = Math.min(displayWidth, displayHeight) * 0.6;
    const centerX = offsetX + (displayWidth - initialSize) / 2;
    const centerY = offsetY + (displayHeight - initialSize) / 2;

    translateX.value = centerX;
    translateY.value = centerY;
    startX.value = centerX;
    startY.value = centerY;
    cropWidth.value = initialSize;
    cropHeight.value = initialSize;
    startWidth.value = initialSize;
    startHeight.value = initialSize;

    setIsReady(true);
  };

  // Pan gesture for moving the crop area
  const panGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      const newX = startX.value + event.translationX;
      const newY = startY.value + event.translationY;

      // Constrain to image bounds
      const maxX = displayOffset.x + displaySize.width - cropWidth.value;
      const maxY = displayOffset.y + displaySize.height - cropHeight.value;

      translateX.value = Math.max(displayOffset.x, Math.min(maxX, newX));
      translateY.value = Math.max(displayOffset.y, Math.min(maxY, newY));
    });

  // Pan gesture for resizing
  const resizeGesture = Gesture.Pan()
    .onStart(() => {
      startWidth.value = cropWidth.value;
      startHeight.value = cropHeight.value;
    })
    .onUpdate((event) => {
      const newWidth = Math.max(
        50,
        Math.min(
          displayOffset.x + displaySize.width - translateX.value,
          startWidth.value + event.translationX
        )
      );

      if (aspect === "free") {
        const newHeight = Math.max(
          50,
          Math.min(
            displayOffset.y + displaySize.height - translateY.value,
            startHeight.value + event.translationY
          )
        );
        cropWidth.value = newWidth;
        cropHeight.value = newHeight;
      } else {
        const [w, h] = aspect.split(":").map(Number);
        const newHeight = (newWidth * h) / w;

        // Check if new height fits
        if (
          translateY.value + newHeight <=
          displayOffset.y + displaySize.height
        ) {
          cropWidth.value = newWidth;
          cropHeight.value = newHeight;
        }
      }
    });

  const cropStyle = useAnimatedStyle(() => ({
    position: "absolute",
    left: 0,
    top: 0,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    width: cropWidth.value,
    height: cropHeight.value,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
  }));

  const resizeHandleStyle = useAnimatedStyle(() => ({
    position: "absolute",
    width: 30,
    height: 30,
    backgroundColor: colors.primary,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#fff",
    transform: [
      { translateX: cropWidth.value - 15 },
      { translateY: cropHeight.value - 15 },
    ],
  }));

  const confirm = async () => {
    if (!imageSize.width || !displaySize.width) return;

    const scaleX = imageSize.width / displaySize.width;
    const scaleY = imageSize.height / displaySize.height;

    const crop = {
      originX: Math.max(
        0,
        Math.round((translateX.value - displayOffset.x) * scaleX)
      ),
      originY: Math.max(
        0,
        Math.round((translateY.value - displayOffset.y) * scaleY)
      ),
      width: Math.round(cropWidth.value * scaleX),
      height: Math.round(cropHeight.value * scaleY),
    };

    // Ensure crop doesn't exceed image bounds
    crop.width = Math.min(crop.width, imageSize.width - crop.originX);
    crop.height = Math.min(crop.height, imageSize.height - crop.originY);

    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ crop }],
        {
          compress: 1,
          format: ImageManipulator.SaveFormat.PNG,
        }
      );

      onDone({
        uri: manipResult.uri,
        rect: {
          x: crop.originX,
          y: crop.originY,
          width: crop.width,
          height: crop.height,
        },
      });
    } catch (error) {
      console.error("Error cropping image:", error);
    }
  };

  const setPreset = (a: Aspect) => {
    setAspect(a);
    if (a === "free") return;

    const [w, h] = a.split(":").map(Number);
    const maxWidth = displaySize.width * 0.8;
    const width = Math.min(maxWidth, cropWidth.value);
    const height = (width * h) / w;

    // Check if height fits, otherwise adjust width
    const maxHeight = displaySize.height * 0.8;
    let finalWidth = width;
    let finalHeight = height;

    if (height > maxHeight) {
      finalHeight = maxHeight;
      finalWidth = (finalHeight * w) / h;
    }

    // Animate to new size and center position
    cropWidth.value = withSpring(finalWidth);
    cropHeight.value = withSpring(finalHeight);
    translateX.value = withSpring(
      displayOffset.x + (displaySize.width - finalWidth) / 2
    );
    translateY.value = withSpring(
      displayOffset.y + (displaySize.height - finalHeight) / 2
    );
  };

  return (
    <Modal visible={visible} onRequestClose={onCancel} animationType="slide">
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View
          style={{ flex: 1, backgroundColor: colors.bg }}
          onLayout={onLayout}
        >
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <Image
              source={{ uri }}
              style={{ width: "100%", height: "100%" }}
              contentFit="contain"
            />

            {/* Crop overlay - always render but with proper positioning */}
            {isReady && (
              <GestureDetector gesture={panGesture}>
                <Animated.View style={cropStyle}>
                  {/* Resize handle */}
                  <GestureDetector gesture={resizeGesture}>
                    <Animated.View style={resizeHandleStyle} />
                  </GestureDetector>
                </Animated.View>
              </GestureDetector>
            )}
          </View>

          <View
            style={{ padding: spacing.md, backgroundColor: colors.surface }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: spacing.md,
              }}
            >
              {(["free", "1:1", "3:2", "4:3", "16:9"] as Aspect[]).map((a) => (
                <Pressable
                  key={a}
                  onPress={() => setPreset(a)}
                  style={{
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.md,
                    backgroundColor:
                      aspect === a ? colors.primary : colors.overlay,
                    borderRadius: radii.sm,
                  }}
                >
                  <Text style={{ color: colors.text }}>{a}</Text>
                </Pressable>
              ))}
            </View>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Pressable onPress={onCancel} style={{ padding: spacing.md }}>
                <Text style={{ color: colors.textMuted }}>Cancel</Text>
              </Pressable>
              <Pressable onPress={confirm} style={{ padding: spacing.md }}>
                <Text style={{ color: colors.text }}>Done</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
};
