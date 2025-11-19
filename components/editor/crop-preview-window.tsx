import { colors } from "@/utiles/tokens";
import React, { memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { ClipPath, Defs, Path, Image as SvgImage } from "react-native-svg";

interface Point {
  x: number;
  y: number;
}

type AspectKey = "free" | "1:1" | "3:2" | "4:3" | "16:9";

interface CropPreviewWindowProps {
  uri?: string | null;
  path: Point[];
  displaySize: { width: number; height: number };
  visible: boolean;
  aspectRatio: AspectKey;
}

const MAX_PREVIEW_WIDTH = 160;
const MAX_PREVIEW_HEIGHT = 120;

const calculateBounds = (points: Point[]) => {
  if (points.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = points[0].x;
  let minY = points[0].y;
  let maxX = points[0].x;
  let maxY = points[0].y;

  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }

  return {
    x: minX,
    y: minY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  };
};

const CropPreviewWindowComponent: React.FC<CropPreviewWindowProps> = ({
  uri,
  path,
  displaySize,
  visible,
  aspectRatio,
}) => {
  const clipId = useMemo(
    () => `previewClip-${Math.random().toString(36).slice(2, 8)}`,
    []
  );

  const bounds = useMemo(() => calculateBounds(path), [path]);

  const previewScale = useMemo(() => {
    if (bounds.width === 0 || bounds.height === 0) return 1;
    const scaleX = MAX_PREVIEW_WIDTH / bounds.width;
    const scaleY = MAX_PREVIEW_HEIGHT / bounds.height;
    return Math.min(scaleX, scaleY, 2);
  }, [bounds.height, bounds.width]);

  const previewDimensions = useMemo(() => {
    const width = Math.min(
      MAX_PREVIEW_WIDTH,
      Math.max(1, bounds.width) * previewScale
    );
    const height = Math.min(
      MAX_PREVIEW_HEIGHT,
      Math.max(1, bounds.height) * previewScale
    );
    return {
      width: Math.max(64, width),
      height: Math.max(48, height),
    };
  }, [bounds.width, bounds.height, previewScale]);

  const scaledPath = useMemo(
    () =>
      path.map((point) => ({
        x: (point.x - bounds.x) * previewScale,
        y: (point.y - bounds.y) * previewScale,
      })),
    [path, bounds.x, bounds.y, previewScale]
  );

  const previewPath = useMemo(() => {
    if (scaledPath.length === 0) return "";
    const shouldClose = aspectRatio !== "free" && scaledPath.length >= 4;
    let pathStr = `M ${scaledPath[0].x} ${scaledPath[0].y}`;
    for (let i = 1; i < scaledPath.length; i++) {
      pathStr += ` L ${scaledPath[i].x} ${scaledPath[i].y}`;
    }
    if (shouldClose) {
      pathStr += " Z";
    }
    return pathStr;
  }, [scaledPath, aspectRatio]);

  const canRender =
    visible &&
    !!uri &&
    displaySize.width > 0 &&
    displaySize.height > 0 &&
    bounds.width > 0 &&
    bounds.height > 0 &&
    !!previewPath;

  if (!canRender) {
    return null;
  }

  return (
    <View
      style={[
        styles.wrapper,
        { width: previewDimensions.width, height: previewDimensions.height },
      ]}
    >
      <Svg
        width={previewDimensions.width}
        height={previewDimensions.height}
        pointerEvents="none"
        viewBox={`0 0 ${previewDimensions.width} ${previewDimensions.height}`}
      >
        <Defs>
          <ClipPath id={clipId}>
            <Path d={previewPath} />
          </ClipPath>
        </Defs>
        <SvgImage
          href={{ uri }}
          width={displaySize.width * previewScale}
          height={displaySize.height * previewScale}
          x={-bounds.x * previewScale}
          y={-bounds.y * previewScale}
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#${clipId})`}
        />
      </Svg>
    </View>
  );
};

export const CropPreviewWindow = memo(CropPreviewWindowComponent);

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: colors.surface,
    position: "absolute",
    left: 10,
    bottom: 50,
    zIndex: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    pointerEvents: "none",
  },
});
