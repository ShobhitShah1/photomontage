import { Layer } from "@/store/store";
import { colors } from "@/utiles/tokens";
import { Image } from "expo-image";
import * as ImageManipulator from "expo-image-manipulator";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  LayoutChangeEvent,
  StyleSheet,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS, useSharedValue } from "react-native-reanimated";
import Svg, { Circle, Path } from "react-native-svg";

interface DetailEditingViewProps {
  layer: Layer;
  onComplete: (result: {
    croppedUri: string;
    maskPath: string;
    cropRect: { x: number; y: number; width: number; height: number };
  }) => void;
  onCancel: () => void;
  aspectRatio?: "free" | "1:1" | "3:2" | "4:3" | "16:9";
  onActionsReady?: (actions: {
    clearPath: () => void;
    toggleEditMode: () => void;
    applyCrop: () => void;
    canApply: boolean;
    hasPath: boolean;
    isEditMode: boolean;
  }) => void;
}

interface Point {
  x: number;
  y: number;
}

export const DetailEditingView: React.FC<DetailEditingViewProps> = ({
  layer,
  onComplete,
  onCancel,
  aspectRatio = "free",
  onActionsReady,
}) => {
  const [container, setContainer] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const [displayOffset, setDisplayOffset] = useState({ x: 0, y: 0 });
  const [isReady, setIsReady] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [path, setPath] = useState<Point[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(
    null
  );
  const isDrawingRef = useRef(false);
  const pathRef = useRef<Point[]>([]);

  const displaySizeWidth = useSharedValue(0);
  const displaySizeHeight = useSharedValue(0);
  const displayOffsetX = useSharedValue(0);
  const displayOffsetY = useSharedValue(0);
  const isReadyShared = useSharedValue(false);

  const uri = layer.originalUri;
  const isEditingCropped = false;

  useEffect(() => {
    if (!uri) {
      setIsImageLoading(false);
      return;
    }

    setIsImageLoading(true);
    let cancelled = false;

    const applySize = (width: number, height: number) => {
      if (cancelled) return;
      setImageSize({ width, height });
      setIsImageLoading(false);
    };

    const fallbackSize = () => {
      if (cancelled) return;
      if (isEditingCropped && layer.cropRect) {
        applySize(layer.cropRect.width, layer.cropRect.height);
      } else {
        applySize(layer.width, layer.height);
      }
    };

    const fetchSize = async () => {
      try {
        const imageInfo = await ImageManipulator.manipulateAsync(uri, [], {
          compress: 1,
          format: ImageManipulator.SaveFormat.PNG,
        });

        if (imageInfo?.width && imageInfo?.height) {
          applySize(imageInfo.width, imageInfo.height);
          return;
        }
        fallbackSize();
      } catch (error) {
        fallbackSize();
      }
    };

    fetchSize();

    return () => {
      cancelled = true;
    };
  }, [uri, layer.width, layer.height, isEditingCropped, layer.cropRect]);

  useEffect(() => {
    if (
      !uri ||
      imageSize.width === 0 ||
      imageSize.height === 0 ||
      !container ||
      container.width === 0 ||
      container.height === 0
    ) {
      setIsReady(false);
      return;
    }

    const containerWidth = container.width;
    const containerHeight = container.height;

    const imageAspect = imageSize.width / imageSize.height;
    const containerAspect = containerWidth / containerHeight;

    const maxDisplayWidth = containerWidth;
    const maxDisplayHeight = containerHeight * 0.8;

    let displayWidth: number;
    let displayHeight: number;

    if (
      imageSize.width <= maxDisplayWidth &&
      imageSize.height <= maxDisplayHeight
    ) {
      displayWidth = imageSize.width;
      displayHeight = imageSize.height;
    } else {
      const scaleW = maxDisplayWidth / imageSize.width;
      const scaleH = maxDisplayHeight / imageSize.height;
      const scale = Math.min(scaleW, scaleH);
      displayWidth = imageSize.width * scale;
      displayHeight = imageSize.height * scale;
    }

    const offsetX = (containerWidth - displayWidth) / 2;
    const offsetY = (containerHeight - displayHeight) / 2;

    setDisplaySize({ width: displayWidth, height: displayHeight });
    setDisplayOffset({ x: offsetX, y: offsetY });
    displaySizeWidth.value = displayWidth;
    displaySizeHeight.value = displayHeight;
    displayOffsetX.value = offsetX;
    displayOffsetY.value = offsetY;
    isReadyShared.value = true;
    setIsReady(true);
  }, [uri, imageSize.width, imageSize.height, container]);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setContainer({ width, height });
    }
  }, []);

  const buildPathString = useCallback(
    (points: Point[], closed = false): string => {
      if (points.length === 0) return "";
      if (points.length === 1) {
        return `M ${points[0].x} ${points[0].y}`;
      }

      let pathStr = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        pathStr += ` L ${points[i].x} ${points[i].y}`;
      }
      if (closed && points.length > 2) {
        pathStr += ` Z`;
      }
      return pathStr;
    },
    []
  );

  const updatePath = useCallback((newPath: Point[]) => {
    setPath(newPath);
    pathRef.current = newPath;
  }, []);

  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  const pathStartRef = useRef<Point[]>([]);

  const panGesture = Gesture.Pan()
    .onStart((event) => {
      "worklet";
      if (!isReadyShared.value) return;

      const x = event.x;
      const y = event.y;

      if (
        x >= displayOffsetX.value &&
        x <= displayOffsetX.value + displaySizeWidth.value &&
        y >= displayOffsetY.value &&
        y <= displayOffsetY.value + displaySizeHeight.value
      ) {
        const relativeX = Math.max(
          0,
          Math.min(displaySizeWidth.value, x - displayOffsetX.value)
        );
        const relativeY = Math.max(
          0,
          Math.min(displaySizeHeight.value, y - displayOffsetY.value)
        );

        if (aspectRatio !== "free" && pathRef.current.length === 4) {
          const bounds = {
            minX: Math.min(...pathRef.current.map((p) => p.x)),
            minY: Math.min(...pathRef.current.map((p) => p.y)),
            maxX: Math.max(...pathRef.current.map((p) => p.x)),
            maxY: Math.max(...pathRef.current.map((p) => p.y)),
          };

          if (
            relativeX >= bounds.minX &&
            relativeX <= bounds.maxX &&
            relativeY >= bounds.minY &&
            relativeY <= bounds.maxY
          ) {
            panStartRef.current = { x: relativeX, y: relativeY };
            pathStartRef.current = [...pathRef.current];
            return;
          }
        }

        isDrawingRef.current = true;
        const newPoint = { x: relativeX, y: relativeY };
        pathRef.current = [newPoint];
        runOnJS(updatePath)([newPoint]);
      }
    })
    .onUpdate((event) => {
      "worklet";
      if (!isReadyShared.value) return;

      const x = event.x;
      const y = event.y;

      if (
        x >= displayOffsetX.value &&
        x <= displayOffsetX.value + displaySizeWidth.value &&
        y >= displayOffsetY.value &&
        y <= displayOffsetY.value + displaySizeHeight.value
      ) {
        const relativeX = Math.max(
          0,
          Math.min(displaySizeWidth.value, x - displayOffsetX.value)
        );
        const relativeY = Math.max(
          0,
          Math.min(displaySizeHeight.value, y - displayOffsetY.value)
        );

        if (
          panStartRef.current &&
          pathStartRef.current.length === 4 &&
          aspectRatio !== "free"
        ) {
          const deltaX = relativeX - panStartRef.current.x;
          const deltaY = relativeY - panStartRef.current.y;

          const updatedPath = pathStartRef.current.map((point) => ({
            x: Math.max(0, Math.min(displaySizeWidth.value, point.x + deltaX)),
            y: Math.max(0, Math.min(displaySizeHeight.value, point.y + deltaY)),
          }));

          pathRef.current = updatedPath;
          runOnJS(updatePath)(updatedPath);
          return;
        }

        if (!isDrawingRef.current) return;

        const newPoint = { x: relativeX, y: relativeY };
        const lastPoint = pathRef.current[pathRef.current.length - 1];
        const distance = Math.sqrt(
          Math.pow(newPoint.x - lastPoint.x, 2) +
            Math.pow(newPoint.y - lastPoint.y, 2)
        );

        if (distance > 8) {
          pathRef.current = [...pathRef.current, newPoint];
          runOnJS(updatePath)([...pathRef.current]);
        }
      }
    })
    .onEnd(() => {
      "worklet";
      isDrawingRef.current = false;
      panStartRef.current = null;
      pathStartRef.current = [];
    });

  const selectedPointIndexRef = useRef<number | null>(null);

  useEffect(() => {
    selectedPointIndexRef.current = selectedPointIndex;
  }, [selectedPointIndex]);

  const pointEditGesture = Gesture.Pan()
    .onStart((event) => {
      "worklet";
      if (!editMode || pathRef.current.length === 0) return;

      const x = event.x - displayOffsetX.value;
      const y = event.y - displayOffsetY.value;

      let minDist = Infinity;
      let closestIndex = -1;

      for (let i = 0; i < pathRef.current.length; i++) {
        const point = pathRef.current[i];
        const dist = Math.sqrt(
          Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2)
        );
        if (dist < minDist && dist < 30) {
          minDist = dist;
          closestIndex = i;
        }
      }

      if (closestIndex >= 0) {
        selectedPointIndexRef.current = closestIndex;
        runOnJS(setSelectedPointIndex)(closestIndex);
      }
    })
    .onUpdate((event) => {
      "worklet";
      const currentSelected = selectedPointIndexRef.current;
      if (
        !editMode ||
        currentSelected === null ||
        pathRef.current.length === 0
      ) {
        return;
      }

      let x = Math.max(
        0,
        Math.min(displaySizeWidth.value, event.x - displayOffsetX.value)
      );
      let y = Math.max(
        0,
        Math.min(displaySizeHeight.value, event.y - displayOffsetY.value)
      );

      if (aspectRatio !== "free" && pathRef.current.length === 4) {
        const ratios: Record<string, number> = {
          "1:1": 1,
          "3:2": 3 / 2,
          "4:3": 4 / 3,
          "16:9": 16 / 9,
        };
        const targetRatio = ratios[aspectRatio];

        if (targetRatio) {
          const bounds = {
            minX: Math.min(...pathRef.current.map((p) => p.x)),
            minY: Math.min(...pathRef.current.map((p) => p.y)),
            maxX: Math.max(...pathRef.current.map((p) => p.x)),
            maxY: Math.max(...pathRef.current.map((p) => p.y)),
          };

          const centerX = (bounds.minX + bounds.maxX) / 2;
          const centerY = (bounds.minY + bounds.maxY) / 2;

          let newWidth = Math.abs(x - centerX) * 2;
          let newHeight = Math.abs(y - centerY) * 2;

          if (newWidth / newHeight > targetRatio) {
            newHeight = newWidth / targetRatio;
          } else {
            newWidth = newHeight * targetRatio;
          }

          const halfWidth = newWidth / 2;
          const halfHeight = newHeight / 2;

          const updatedPath: Point[] = [
            { x: centerX - halfWidth, y: centerY - halfHeight },
            { x: centerX + halfWidth, y: centerY - halfHeight },
            { x: centerX + halfWidth, y: centerY + halfHeight },
            { x: centerX - halfWidth, y: centerY + halfHeight },
          ];

          for (let i = 0; i < updatedPath.length; i++) {
            updatedPath[i].x = Math.max(
              0,
              Math.min(displaySizeWidth.value, updatedPath[i].x)
            );
            updatedPath[i].y = Math.max(
              0,
              Math.min(displaySizeHeight.value, updatedPath[i].y)
            );
          }

          pathRef.current = updatedPath;
          runOnJS(updatePath)(updatedPath);
          return;
        }
      }

      const updatedPath = [...pathRef.current];
      updatedPath[currentSelected] = { x, y };
      pathRef.current = updatedPath;
      runOnJS(updatePath)(updatedPath);
    })
    .onEnd(() => {
      "worklet";
      selectedPointIndexRef.current = null;
      runOnJS(setSelectedPointIndex)(null);
    });

  const clearPath = useCallback(() => {
    setPath([]);
    pathRef.current = [];
    setEditMode(false);
    setSelectedPointIndex(null);
  }, []);

  const toggleEditMode = useCallback(() => {
    if (path.length > 0) {
      setEditMode((prev) => !prev);
      setSelectedPointIndex(null);
    }
  }, [path.length]);

  const calculateBounds = useCallback((points: Point[]) => {
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
  }, []);

  const handleComplete = useCallback(async () => {
    if (path.length < 3 || !isReady || !imageSize || !displaySize) {
      return;
    }

    const bounds = calculateBounds(path);
    if (bounds.width === 0 || bounds.height === 0) {
      return;
    }

    const scaleX = imageSize.width / displaySize.width;
    const scaleY = imageSize.height / displaySize.height;

    const scaledBounds = {
      x: Math.max(0, Math.round(bounds.x * scaleX)),
      y: Math.max(0, Math.round(bounds.y * scaleY)),
      width: Math.min(
        Math.round(bounds.width * scaleX),
        imageSize.width - Math.round(bounds.x * scaleX)
      ),
      height: Math.min(
        Math.round(bounds.height * scaleY),
        imageSize.height - Math.round(bounds.y * scaleY)
      ),
    };

    const cropRect = {
      originX: Math.round(scaledBounds.x),
      originY: Math.round(scaledBounds.y),
      width: Math.max(1, Math.round(scaledBounds.width)),
      height: Math.max(1, Math.round(scaledBounds.height)),
    };

    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ crop: cropRect }],
        {
          compress: 1,
          format: ImageManipulator.SaveFormat.PNG,
        }
      );

      const adjustedPoints = path.map((p) => ({
        x: Math.max(0, p.x - bounds.x),
        y: Math.max(0, p.y - bounds.y),
      }));

      const closedPoints = [...adjustedPoints];
      if (closedPoints.length > 0) {
        const first = closedPoints[0];
        const last = closedPoints[closedPoints.length - 1];
        const distToStart = Math.sqrt(
          Math.pow(last.x - first.x, 2) + Math.pow(last.y - first.y, 2)
        );
        if (distToStart > 10) {
          closedPoints.push({ x: first.x, y: first.y });
        }
      }

      const actualWidth = manipResult.width || cropRect.width;
      const actualHeight = manipResult.height || cropRect.height;

      const scaleX = actualWidth / bounds.width;
      const scaleY = actualHeight / bounds.height;

      const scaledPoints = closedPoints.map((p) => ({
        x: p.x * scaleX,
        y: p.y * scaleY,
      }));

      const maskPath = buildPathString(scaledPoints, true);

      onComplete({
        croppedUri: manipResult.uri,
        maskPath,
        cropRect: {
          x: cropRect.originX,
          y: cropRect.originY,
          width: actualWidth,
          height: actualHeight,
        },
      });
    } catch (error) {
      console.error("Error processing crop:", error);
    }
  }, [
    path,
    isReady,
    imageSize,
    displaySize,
    uri,
    calculateBounds,
    buildPathString,
    onComplete,
  ]);

  useEffect(() => {
    if (onActionsReady) {
      onActionsReady({
        clearPath,
        toggleEditMode,
        applyCrop: handleComplete,
        canApply: path.length >= 3 && isReady,
        hasPath: path.length > 0,
        isEditMode: editMode,
      });
    }
  }, [
    path.length,
    isReady,
    editMode,
    // onActionsReady, // Remove stable function from deps to be safe, though useState setter is stable.
    // clearPath,
    // toggleEditMode,
    // handleComplete,
  ]);

  useEffect(() => {
    if (
      aspectRatio !== "free" &&
      isReady &&
      imageSize.width > 0 &&
      imageSize.height > 0 &&
      displaySize.width > 0 &&
      displaySize.height > 0
    ) {
      const ratios: Record<string, number> = {
        "1:1": 1,
        "3:2": 3 / 2,
        "4:3": 4 / 3,
        "16:9": 16 / 9,
      };

      const targetRatio = ratios[aspectRatio];
      if (!targetRatio) return;

      let cropWidth = Math.min(displaySize.width * 0.8, displaySize.width);
      let cropHeight = Math.min(displaySize.height * 0.8, displaySize.height);

      if (cropWidth / cropHeight > targetRatio) {
        cropHeight = cropWidth / targetRatio;
        if (cropHeight > displaySize.height) {
          cropHeight = displaySize.height;
          cropWidth = cropHeight * targetRatio;
        }
      } else {
        cropWidth = cropHeight * targetRatio;
        if (cropWidth > displaySize.width) {
          cropWidth = displaySize.width;
          cropHeight = cropWidth / targetRatio;
        }
      }

      const centerX = displaySize.width / 2;
      const centerY = displaySize.height / 2;

      const newPath: Point[] = [
        { x: centerX - cropWidth / 2, y: centerY - cropHeight / 2 },
        { x: centerX + cropWidth / 2, y: centerY - cropHeight / 2 },
        { x: centerX + cropWidth / 2, y: centerY + cropHeight / 2 },
        { x: centerX - cropWidth / 2, y: centerY + cropHeight / 2 },
      ];

      setPath(newPath);
      pathRef.current = newPath;
      setEditMode(false);
    }
  }, [aspectRatio, isReady, imageSize, displaySize]);

  const displayPath = useMemo(() => {
    if (path.length === 0) return "";
    const shouldClose = aspectRatio !== "free" && path.length >= 4;
    return buildPathString(path, shouldClose);
  }, [path, aspectRatio, buildPathString]);

  const showLoader = !isReady || isImageLoading;

  return (
    <View style={styles.container} onLayout={onLayout}>
      <GestureDetector gesture={editMode ? pointEditGesture : panGesture}>
        <View style={styles.content}>
          {showLoader && (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
          {isReady && uri && (
            <>
              <View
                style={[
                  styles.imageContainer,
                  {
                    left: displayOffset.x,
                    top: displayOffset.y,
                    width: displaySize.width,
                    height: displaySize.height,
                  },
                ]}
                pointerEvents="none"
              >
                <Image
                  source={{ uri }}
                  style={styles.image}
                  contentFit="contain"
                  onLoadEnd={() => setIsImageLoading(false)}
                  onError={() => setIsImageLoading(false)}
                />
              </View>

              <View
                style={[
                  styles.overlay,
                  {
                    left: displayOffset.x,
                    top: displayOffset.y,
                    width: displaySize.width,
                    height: displaySize.height,
                  },
                ]}
                pointerEvents="none"
              >
                <Svg width={displaySize.width} height={displaySize.height}>
                  {displayPath && (
                    <>
                      <Path
                        d={displayPath}
                        fill="none"
                        stroke={colors.primary}
                        strokeWidth={4}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {editMode &&
                        path.map((point, index) => (
                          <Circle
                            key={index}
                            cx={point.x}
                            cy={point.y}
                            r={8}
                            fill={
                              index === selectedPointIndex
                                ? colors.primary
                                : "#fff"
                            }
                            stroke={colors.primary}
                            strokeWidth={2}
                          />
                        ))}
                    </>
                  )}
                </Svg>
              </View>
            </>
          )}
        </View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    position: "absolute",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
  },
  loader: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
});
