import { Layer } from "@/store/store";
import React, { FC, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { ClipPath, Defs, Path, Image as SvgImage } from "react-native-svg";

interface MiniCanvasPreviewProps {
  layers: Layer[];
  canvasWidth: number;
  canvasHeight: number;
  previewWidth: number;
  previewHeight: number;
  showBorder?: boolean;
  borderColor?: string;
}

export const MiniCanvasPreview: FC<MiniCanvasPreviewProps> = ({
  layers,
  canvasWidth,
  canvasHeight,
  previewWidth,
  previewHeight,
  showBorder = true,
  borderColor = "#fff",
}) => {
  // Calculate scale to fit canvas in preview
  const scale = useMemo(() => {
    const scaleX = previewWidth / canvasWidth;
    const scaleY = previewHeight / canvasHeight;
    return Math.min(scaleX, scaleY);
  }, [canvasWidth, canvasHeight, previewWidth, previewHeight]);

  // Scaled canvas dimensions
  const scaledWidth = canvasWidth * scale;
  const scaledHeight = canvasHeight * scale;

  // Center offset
  const offsetX = (previewWidth - scaledWidth) / 2;
  const offsetY = (previewHeight - scaledHeight) / 2;

  // Filter only placed/cropped layers
  const visibleLayers = useMemo(() => {
    return [...layers]
      .filter((layer) => layer.croppedUri && layer.maskPath)
      .sort((a, b) => (a.z || 0) - (b.z || 0));
  }, [layers]);

  return (
    <View
      style={[
        styles.container,
        {
          width: previewWidth,
          height: previewHeight,
          borderWidth: showBorder ? 2 : 0,
          borderColor: showBorder ? borderColor : "transparent",
        },
      ]}
    >
      {/* Canvas container scaled down */}
      <View
        style={{
          position: "absolute",
          left: offsetX,
          top: offsetY,
          width: canvasWidth,
          height: canvasHeight,
          transform: [{ scale: scale }],
          transformOrigin: "0 0",
        }}
      >
        {visibleLayers.map((layer) => {
          const clipId = `clip-mini-${layer.id}`;
          const originX = (layer.width || 0) / 2;
          const originY = (layer.height || 0) / 2;

          return (
            <View
              key={layer.id}
              style={{
                position: "absolute",
                left: layer.x || 0,
                top: layer.y || 0,
                width: layer.width || 0,
                height: layer.height || 0,
                zIndex: layer.z || 0,
                transform: [
                  { translateX: originX },
                  { translateY: originY },
                  { scale: layer.scale || 1 },
                  { rotate: `${layer.rotation || 0}rad` },
                  { translateX: -originX },
                  { translateY: -originY },
                ],
              }}
            >
              <Svg
                width={layer.width || 0}
                height={layer.height || 0}
                style={StyleSheet.absoluteFill}
              >
                <Defs>
                  <ClipPath id={clipId}>
                    <Path d={layer.maskPath || ""} />
                  </ClipPath>
                </Defs>
                <SvgImage
                  href={layer.croppedUri || ""}
                  x={0}
                  y={0}
                  width={layer.width || 0}
                  height={layer.height || 0}
                  clipPath={`url(#${clipId})`}
                  preserveAspectRatio="none"
                />
              </Svg>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
});
