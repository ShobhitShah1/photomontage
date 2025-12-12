import { useTransformGesture } from "@/hooks/use-transform-gesture";
import { Layer } from "@/store/store";
import { Image } from "expo-image";
import React, { memo, useCallback, useEffect, useMemo, useRef } from "react";
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

const CanvasImageComponent: React.FC<CanvasImageProps> = ({
  layer,
  isSelected,
  onSelect,
  onChange,
  onRequestCrop,
}) => {
  // trackRender(`CanvasImage-${layer.id.slice(0, 8)}`);

  // useEffect(() => {
  //   if (layer.originalWidth && layer.originalHeight) {
  //     logImageSize(
  //       `Layer-${layer.id.slice(0, 8)}`,
  //       layer.originalWidth,
  //       layer.originalHeight
  //     );
  //   }
  // }, [layer.id]);
  // Use refs to avoid recreating callbacks that would cause gesture recreation
  const layerRef = useRef(layer);
  const onSelectRef = useRef(onSelect);
  const onChangeRef = useRef(onChange);

  // Update refs on each render
  layerRef.current = layer;
  onSelectRef.current = onSelect;
  onChangeRef.current = onChange;

  // Stable callbacks that use refs internally
  const handleSelect = useCallback(() => {
    onSelectRef.current(layerRef.current.id);
  }, []);

  const handleChange = useCallback(
    (n: { x: number; y: number; scale: number; rotation: number }) => {
      // Only update transform properties, preserve all other layer data
      onChangeRef.current({
        ...layerRef.current,
        x: n.x,
        y: n.y,
        scale: n.scale,
        rotation: n.rotation,
      });
    },
    []
  );

  const { gesture, animatedStyle, sync } = useTransformGesture({
    x: layer.x,
    y: layer.y,
    scale: layer.scale,
    rotation: layer.rotation,
    onSelect: handleSelect,
    onChange: handleChange,
  });

  // Sync shared values when layer transform props change from external sources
  // This handles undo/redo and other state changes
  useEffect(() => {
    sync(layer.x, layer.y, layer.scale, layer.rotation);
  }, [layer.x, layer.y, layer.scale, layer.rotation, sync]);

  const src = layer.croppedUri || layer.originalUri;
  const isCropped = !!layer.croppedUri;
  const hasMask = !!layer.maskPath && layer.maskPath.length > 0;

  const displayWidth = layer.width;
  const displayHeight = layer.height;

  // Memoize double tap handler
  const handleDoubleTap = useCallback(() => {
    if (onRequestCrop) {
      onRequestCrop(layer.id);
    }
  }, [onRequestCrop, layer.id]);

  const doubleTap = useMemo(
    () =>
      Gesture.Tap()
        .numberOfTaps(2)
        .onEnd(() => {
          "worklet";
          scheduleOnRN(handleDoubleTap);
        }),
    [handleDoubleTap]
  );

  const finalGesture = useMemo(
    () => Gesture.Simultaneous(doubleTap, gesture),
    [doubleTap, gesture]
  );

  const clipId = `clip-${layer.id}`;

  // Memoize the mask path to avoid re-parsing
  const maskPathData = useMemo(() => layer.maskPath || "", [layer.maskPath]);

  if (!src) return null;

  return (
    <GestureDetector gesture={finalGesture}>
      <Animated.View
        style={[
          styles.container,
          {
            width: displayWidth,
            height: displayHeight,
            zIndex: layer.z,
          },
          animatedStyle,
        ]}
        shouldRasterizeIOS={true}
        renderToHardwareTextureAndroid={true}
      >
        {hasMask ? (
          <MaskedContent
            src={src}
            displayWidth={displayWidth}
            displayHeight={displayHeight}
            clipId={clipId}
            maskPathData={maskPathData}
            isSelected={isSelected}
          />
        ) : (
          <View
            style={{
              width: displayWidth,
              height: displayHeight,
              overflow: "hidden",
            }}
          >
            <Image
              source={{ uri: src }}
              style={{
                width: displayWidth,
                height: displayHeight,
                borderRadius: isCropped ? 0 : 8,
              }}
              contentFit="fill"
              cachePolicy="memory-disk"
              recyclingKey={layer.id}
              priority="high"
            />
            {isSelected && (
              <View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    borderWidth: 2,
                    borderColor: "white",
                    borderRadius: isCropped ? 0 : 8,
                  },
                ]}
                pointerEvents="none"
              />
            )}
          </View>
        )}
      </Animated.View>
    </GestureDetector>
  );
};

interface MaskedContentProps {
  src: string;
  displayWidth: number;
  displayHeight: number;
  clipId: string;
  maskPathData: string;
  isSelected: boolean;
}

const MaskedContent = memo(
  ({
    src,
    displayWidth,
    displayHeight,
    clipId,
    maskPathData,
    isSelected,
  }: MaskedContentProps) => {
    return (
      <View
        style={[
          styles.maskedContainer,
          { width: displayWidth, height: displayHeight },
        ]}
      >
        <Svg
          width={displayWidth}
          height={displayHeight}
          style={StyleSheet.absoluteFill}
        >
          <Defs>
            <ClipPath id={clipId}>
              <Path d={maskPathData} />
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
              d={maskPathData}
              fill="none"
              stroke="white"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </Svg>
      </View>
    );
  },
  (prev, next) =>
    prev.src === next.src &&
    prev.displayWidth === next.displayWidth &&
    prev.displayHeight === next.displayHeight &&
    prev.clipId === next.clipId &&
    prev.maskPathData === next.maskPathData &&
    prev.isSelected === next.isSelected
);

// Custom comparison for memo - only re-render when these specific props change
const arePropsEqual = (prev: CanvasImageProps, next: CanvasImageProps) => {
  // Fast path: if same layer reference, only check selection and callbacks
  if (prev.layer === next.layer) {
    return prev.isSelected === next.isSelected;
  }

  // Compare only essential properties that affect rendering
  return (
    prev.layer.id === next.layer.id &&
    prev.layer.x === next.layer.x &&
    prev.layer.y === next.layer.y &&
    prev.layer.scale === next.layer.scale &&
    prev.layer.rotation === next.layer.rotation &&
    prev.layer.width === next.layer.width &&
    prev.layer.height === next.layer.height &&
    prev.layer.z === next.layer.z &&
    prev.layer.croppedUri === next.layer.croppedUri &&
    prev.layer.originalUri === next.layer.originalUri &&
    prev.layer.maskPath === next.layer.maskPath &&
    prev.isSelected === next.isSelected
  );
};

const CanvasImage = memo(CanvasImageComponent, arePropsEqual);
export default CanvasImage;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    opacity: 1,
    transformOrigin: "0% 0%",
  },
  maskedContainer: {
    overflow: "hidden",
  },
});
