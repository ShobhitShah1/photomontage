import { useTransformGesture } from "@/hooks/use-transform-gesture";
import { Layer } from "@/store/store";
import { Image } from "expo-image";
import React, { useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import Svg, { ClipPath, Defs, Path, Image as SvgImage } from "react-native-svg";
import { scheduleOnRN } from "react-native-worklets";

interface CanvasImageProps {
  layer: Layer;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onChange: (l: Layer) => void;
  onRequestCrop?: (id: string) => void;
}

export const CanvasImage: React.FC<CanvasImageProps> = ({
  layer,
  isSelected,
  onSelect,
  onChange,
  onRequestCrop,
}) => {
  const { gesture, animatedStyle, sync } = useTransformGesture({
    x: layer.x,
    y: layer.y,
    scale: layer.scale,
    rotation: layer.rotation,
    onSelect: () => onSelect(layer.id),
    onChange: (n) => onChange({ ...layer, ...n }),
  });

  useEffect(() => {
    sync(layer.x, layer.y, layer.scale, layer.rotation);
  }, [layer.x, layer.y, layer.scale, layer.rotation, sync]);

  const src = layer.croppedUri || layer.originalUri;
  const isCropped = !!layer.croppedUri;
  const hasMask = !!layer.maskPath && layer.maskPath.length > 0;

  const { displayWidth, displayHeight } = useMemo(() => {
    return {
      displayWidth: layer.width,
      displayHeight: layer.height,
    };
  }, [layer.width, layer.height]);

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (onRequestCrop) {
        scheduleOnRN(onRequestCrop, layer.id);
      }
    });

  const finalGesture = Gesture.Simultaneous(doubleTap, gesture);

  if (!src) return null;

  const clipId = `clip-${layer.id}`;

  const scaledMaskPath = useMemo(() => {
    if (!hasMask || !layer.maskPath || !isCropped || !layer.cropRect) {
      return layer.maskPath;
    }
    return layer.maskPath;
  }, [hasMask, isCropped, layer.maskPath, layer.cropRect]);

  return (
    <GestureDetector gesture={finalGesture}>
      <Animated.View
        style={[
          {
            position: "absolute",
            width: displayWidth,
            height: displayHeight,
            zIndex: layer.z,
            opacity: 1,
          },
          animatedStyle,
        ]}
      >
        {hasMask ? (
          <View
            style={[
              styles.maskedContainer,
              {
                width: displayWidth,
                height: displayHeight,
              },
            ]}
          >
            <Svg
              width={displayWidth}
              height={displayHeight}
              style={StyleSheet.absoluteFill}
            >
              <Defs>
                <ClipPath id={clipId}>
                  <Path d={scaledMaskPath} />
                </ClipPath>
              </Defs>
              <SvgImage
                href={src}
                x="0"
                y="0"
                width={displayWidth}
                height={displayHeight}
                clipPath={`url(#${clipId})`}
                preserveAspectRatio="none"
              />
              {isSelected && (
                <Path
                  d={scaledMaskPath}
                  fill="none"
                  stroke="white"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </Svg>
          </View>
        ) : (
          <View
            style={[
              {
                width: displayWidth,
                height: displayHeight,
                overflow: "hidden",
              },
            ]}
          >
            <Image
              source={{ uri: src }}
              style={[
                {
                  width: displayWidth,
                  height: displayHeight,
                  borderRadius: isCropped ? 0 : 8,
                },
              ]}
              contentFit="fill"
              key={src}
            />
            {isSelected && (
              <View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    borderWidth: 2,
                    borderColor: "white",
                    borderRadius: isCropped ? 0 : 8,
                    pointerEvents: "none",
                  },
                ]}
              />
            )}
          </View>
        )}
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  maskedContainer: {
    overflow: "hidden",
  },
});
