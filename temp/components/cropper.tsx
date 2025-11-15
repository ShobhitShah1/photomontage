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
  LayoutChangeEvent,
  Modal,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { runOnJS, useSharedValue } from "react-native-reanimated";
import Svg, { Circle, Path } from "react-native-svg";
import { colors, spacing } from "../../utiles/tokens";

interface CropperProps {
  visible: boolean;
  uri: string;
  onCancel: () => void;
  onDone: (result: {
    uri: string;
    maskPath: string;
    bounds: { x: number; y: number; width: number; height: number };
    croppedWidth: number;
    croppedHeight: number;
  }) => void;
}

interface Point {
  x: number;
  y: number;
}

export const Cropper: React.FC<CropperProps> = ({
  visible,
  uri,
  onCancel,
  onDone,
}) => {
  const windowDimensions = useWindowDimensions();
  const [container, setContainer] = useState({ width: 0, height: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const [displayOffset, setDisplayOffset] = useState({ x: 0, y: 0 });
  const [isReady, setIsReady] = useState(false);
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

  useEffect(() => {
    if (visible && uri) {
      setPath([]);
      pathRef.current = [];
      isDrawingRef.current = false;
      isReadyShared.value = false;
      setIsReady(false);
      setImageSize({ width: 0, height: 0 });
      setDisplaySize({ width: 0, height: 0 });
      setDisplayOffset({ x: 0, y: 0 });
      displaySizeWidth.value = 0;
      displaySizeHeight.value = 0;
      displayOffsetX.value = 0;
      displayOffsetY.value = 0;
    }
  }, [visible, uri]);

  useEffect(() => {
    if (!visible || !uri) return;

    const loadImage = async () => {
      try {
        const imageInfo = await ImageManipulator.manipulateAsync(uri, [], {
          compress: 1,
          format: ImageManipulator.SaveFormat.PNG,
        });

        if (imageInfo?.width && imageInfo?.height) {
          setImageSize({ width: imageInfo.width, height: imageInfo.height });
        }
      } catch (error) {
        console.error("[Cropper] Error loading image:", error);
      }
    };

    loadImage();
  }, [visible, uri]);

  useEffect(() => {
    try {
      if (!visible || !uri || imageSize.width === 0 || imageSize.height === 0) {
        setIsReady(false);
        return;
      }

      const containerWidth =
        container.width > 0 ? container.width : windowDimensions.width;
      const containerHeight =
        container.height > 0 ? container.height : windowDimensions.height;

      if (
        containerWidth === 0 ||
        containerHeight === 0 ||
        isNaN(containerWidth) ||
        isNaN(containerHeight) ||
        !isFinite(containerWidth) ||
        !isFinite(containerHeight)
      ) {
        setIsReady(false);
        return;
      }

      if (
        isNaN(imageSize.width) ||
        isNaN(imageSize.height) ||
        !isFinite(imageSize.width) ||
        !isFinite(imageSize.height) ||
        imageSize.width <= 0 ||
        imageSize.height <= 0
      ) {
        setIsReady(false);
        return;
      }

      const imageAspect = imageSize.width / imageSize.height;
      const containerAspect = containerWidth / containerHeight;

      if (
        isNaN(imageAspect) ||
        isNaN(containerAspect) ||
        !isFinite(imageAspect) ||
        !isFinite(containerAspect)
      ) {
        setIsReady(false);
        return;
      }

      let displayWidth, displayHeight, offsetX, offsetY;

      const maxDisplayWidth = containerWidth;
      const maxDisplayHeight = containerHeight * 0.75;

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

      offsetX = (containerWidth - displayWidth) / 2;
      offsetY = (containerHeight - displayHeight) / 2;

      if (
        displayWidth > 0 &&
        displayHeight > 0 &&
        !isNaN(displayWidth) &&
        !isNaN(displayHeight) &&
        !isNaN(offsetX) &&
        !isNaN(offsetY) &&
        isFinite(displayWidth) &&
        isFinite(displayHeight) &&
        isFinite(offsetX) &&
        isFinite(offsetY)
      ) {
        const newDisplaySize = { width: displayWidth, height: displayHeight };
        const newDisplayOffset = { x: offsetX, y: offsetY };
        setDisplaySize(newDisplaySize);
        setDisplayOffset(newDisplayOffset);
        displaySizeWidth.value = displayWidth;
        displaySizeHeight.value = displayHeight;
        displayOffsetX.value = offsetX;
        displayOffsetY.value = offsetY;
        isReadyShared.value = true;
        setIsReady(true);
      } else {
        isReadyShared.value = false;
        setIsReady(false);
      }
    } catch (error) {
      console.error("[Cropper] Error calculating bounds:", error);
      setIsReady(false);
    }
  }, [
    visible,
    uri,
    imageSize.width,
    imageSize.height,
    container.width,
    container.height,
    windowDimensions.width,
    windowDimensions.height,
  ]);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setContainer({ width, height });
    }
  }, []);

  const buildPathString = useCallback(
    (points: Point[], closed: boolean = false): string => {
      if (points.length === 0) return "";
      if (points.length === 1) {
        return `M ${Math.round(points[0].x * 100) / 100} ${
          Math.round(points[0].y * 100) / 100
        }`;
      }

      let pathStr = `M ${Math.round(points[0].x * 100) / 100} ${
        Math.round(points[0].y * 100) / 100
      }`;
      for (let i = 1; i < points.length; i++) {
        const x = Math.round(points[i].x * 100) / 100;
        const y = Math.round(points[i].y * 100) / 100;
        pathStr += ` L ${x} ${y}`;
      }
      if (closed && points.length > 2) {
        pathStr += ` Z`;
      }
      return pathStr;
    },
    []
  );

  const simplifyPath = useCallback(
    (points: Point[], tolerance: number = 8): Point[] => {
      if (points.length <= 2) return points;

      const simplified: Point[] = [points[0]];

      for (let i = 1; i < points.length - 1; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const next = points[i + 1];

        const distToPrev = Math.sqrt(
          Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
        );
        const distToNext = Math.sqrt(
          Math.pow(next.x - curr.x, 2) + Math.pow(next.y - curr.y, 2)
        );

        const angle = Math.abs(
          Math.atan2(next.y - curr.y, next.x - curr.x) -
            Math.atan2(curr.y - prev.y, curr.x - prev.x)
        );

        if (distToPrev > tolerance || distToNext > tolerance || angle > 0.3) {
          simplified.push(curr);
        }
      }

      simplified.push(points[points.length - 1]);
      return simplified;
    },
    []
  );

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

  const updatePath = useCallback((newPath: Point[]) => {
    setPath(newPath);
  }, []);

  const simplifyAndUpdatePath = useCallback(
    (points: Point[]) => {
      const simplified = simplifyPath(points, 5);
      setPath(simplified);
      pathRef.current = simplified;
    },
    [simplifyPath]
  );

  const panGesture = Gesture.Pan()
    .onStart((event) => {
      "worklet";
      const sizeW = displaySizeWidth.value;
      const sizeH = displaySizeHeight.value;
      const offsetX = displayOffsetX.value;
      const offsetY = displayOffsetY.value;
      const ready = isReadyShared.value;

      if (
        !ready ||
        sizeW === 0 ||
        sizeH === 0 ||
        isNaN(sizeW) ||
        isNaN(sizeH) ||
        isNaN(offsetX) ||
        isNaN(offsetY)
      ) {
        return;
      }

      const x = event.x;
      const y = event.y;

      if (isNaN(x) || isNaN(y) || !isFinite(x) || !isFinite(y)) {
        return;
      }

      if (
        x >= offsetX &&
        x <= offsetX + sizeW &&
        y >= offsetY &&
        y <= offsetY + sizeH
      ) {
        isDrawingRef.current = true;
        const relativeX = Math.max(0, Math.min(sizeW, x - offsetX));
        const relativeY = Math.max(0, Math.min(sizeH, y - offsetY));

        if (isNaN(relativeX) || isNaN(relativeY)) {
          return;
        }

        const newPoint = { x: relativeX, y: relativeY };
        pathRef.current = [newPoint];
        runOnJS(updatePath)([newPoint]);
      }
    })
    .onUpdate((event) => {
      "worklet";
      if (!isDrawingRef.current || !isReadyShared.value) return;

      const sizeW = displaySizeWidth.value;
      const sizeH = displaySizeHeight.value;
      const offsetX = displayOffsetX.value;
      const offsetY = displayOffsetY.value;

      if (sizeW === 0 || sizeH === 0 || isNaN(sizeW) || isNaN(sizeH)) {
        return;
      }

      const x = event.x;
      const y = event.y;

      if (isNaN(x) || isNaN(y) || !isFinite(x) || !isFinite(y)) {
        return;
      }

      if (
        x >= offsetX &&
        x <= offsetX + sizeW &&
        y >= offsetY &&
        y <= offsetY + sizeH
      ) {
        const relativeX = Math.max(0, Math.min(sizeW, x - offsetX));
        const relativeY = Math.max(0, Math.min(sizeH, y - offsetY));

        if (isNaN(relativeX) || isNaN(relativeY)) {
          return;
        }

        const newPoint = { x: relativeX, y: relativeY };

        if (pathRef.current.length === 0) {
          pathRef.current = [newPoint];
          runOnJS(updatePath)([newPoint]);
          return;
        }

        const lastPoint = pathRef.current[pathRef.current.length - 1];
        const distance = Math.sqrt(
          Math.pow(newPoint.x - lastPoint.x, 2) +
            Math.pow(newPoint.y - lastPoint.y, 2)
        );

        if (isNaN(distance) || !isFinite(distance)) {
          return;
        }

        if (distance > 8) {
          pathRef.current = [...pathRef.current, newPoint];
          runOnJS(updatePath)([...pathRef.current]);
        }
      }
    })
    .onEnd(() => {
      "worklet";
      isDrawingRef.current = false;
      if (pathRef.current.length > 2) {
        runOnJS(simplifyAndUpdatePath)(pathRef.current);
      }
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

  const selectedPointIndexRef = useRef<number | null>(null);

  useEffect(() => {
    selectedPointIndexRef.current = selectedPointIndex;
  }, [selectedPointIndex]);

  const pointEditGesture = Gesture.Pan()
    .onStart((event) => {
      "worklet";
      if (!editMode || pathRef.current.length === 0) return;

      const sizeW = displaySizeWidth.value;
      const sizeH = displaySizeHeight.value;
      const offsetX = displayOffsetX.value;
      const offsetY = displayOffsetY.value;

      const x = event.x - offsetX;
      const y = event.y - offsetY;

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

      const sizeW = displaySizeWidth.value;
      const sizeH = displaySizeHeight.value;
      const offsetX = displayOffsetX.value;
      const offsetY = displayOffsetY.value;

      const x = Math.max(0, Math.min(sizeW, event.x - offsetX));
      const y = Math.max(0, Math.min(sizeH, event.y - offsetY));

      if (!isNaN(x) && !isNaN(y) && isFinite(x) && isFinite(y)) {
        const updatedPath = [...pathRef.current];
        updatedPath[currentSelected] = { x, y };
        pathRef.current = updatedPath;
        runOnJS(updatePath)(updatedPath);
      }
    })
    .onEnd(() => {
      "worklet";
      selectedPointIndexRef.current = null;
      runOnJS(setSelectedPointIndex)(null);
    });

  const confirm = useCallback(async () => {
    try {
      if (
        path.length < 3 ||
        !isReady ||
        !imageSize ||
        !displaySize ||
        imageSize.width === 0 ||
        imageSize.height === 0 ||
        displaySize.width === 0 ||
        displaySize.height === 0
      ) {
        return;
      }

      const bounds = calculateBounds(path);
      if (bounds.width === 0 || bounds.height === 0) {
        return;
      }

      if (
        isNaN(displaySize.width) ||
        isNaN(displaySize.height) ||
        displaySize.width <= 0 ||
        displaySize.height <= 0
      ) {
        return;
      }

      const scaleX = imageSize.width / displaySize.width;
      const scaleY = imageSize.height / displaySize.height;

      if (
        isNaN(scaleX) ||
        isNaN(scaleY) ||
        !isFinite(scaleX) ||
        !isFinite(scaleY) ||
        scaleX <= 0 ||
        scaleY <= 0
      ) {
        return;
      }

      const scaledBounds = {
        x: Math.max(0, bounds.x * scaleX),
        y: Math.max(0, bounds.y * scaleY),
        width: Math.min(
          bounds.width * scaleX,
          imageSize.width - bounds.x * scaleX
        ),
        height: Math.min(
          bounds.height * scaleY,
          imageSize.height - bounds.y * scaleY
        ),
      };

      const cropRect = {
        originX: Math.round(scaledBounds.x),
        originY: Math.round(scaledBounds.y),
        width: Math.max(1, Math.round(scaledBounds.width)),
        height: Math.max(1, Math.round(scaledBounds.height)),
      };

      if (cropRect.width <= 0 || cropRect.height <= 0) {
        return;
      }

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

      const simplified = simplifyPath(adjustedPoints, 3);

      if (simplified.length < 3) {
        return;
      }

      const closedPoints = [...simplified];
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
      const adjustedPath = buildPathString(closedPoints, true);

      const croppedWidth = cropRect.width;
      const croppedHeight = cropRect.height;

      onDone({
        uri: manipResult.uri,
        maskPath: adjustedPath,
        bounds: {
          x: 0,
          y: 0,
          width: croppedWidth,
          height: croppedHeight,
        },
        croppedWidth,
        croppedHeight,
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
    simplifyPath,
    onDone,
  ]);

  const displayPath = useMemo(() => {
    if (path.length === 0) return "";
    return buildPathString(path, false);
  }, [path, buildPathString]);

  return (
    <Modal visible={visible} onRequestClose={onCancel} animationType="slide">
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View
          style={{ flex: 1, backgroundColor: colors.bg }}
          onLayout={onLayout}
        >
          <GestureDetector gesture={editMode ? pointEditGesture : panGesture}>
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isReady &&
                displaySize &&
                displayOffset &&
                displaySize.width > 0 &&
                displaySize.height > 0 &&
                !isNaN(displaySize.width) &&
                !isNaN(displaySize.height) &&
                !isNaN(displayOffset.x) &&
                !isNaN(displayOffset.y) &&
                isFinite(displaySize.width) &&
                isFinite(displaySize.height) &&
                isFinite(displayOffset.x) &&
                isFinite(displayOffset.y) &&
                uri && (
                  <>
                    <View
                      style={{
                        position: "absolute",
                        left: displayOffset.x,
                        top: displayOffset.y,
                        width: displaySize.width,
                        height: displaySize.height,
                      }}
                      pointerEvents="none"
                    >
                      <Image
                        source={{ uri }}
                        style={{ width: "100%", height: "100%" }}
                        contentFit="contain"
                      />
                    </View>

                    <View
                      style={{
                        position: "absolute",
                        left: displayOffset.x,
                        top: displayOffset.y,
                        width: displaySize.width,
                        height: displaySize.height,
                      }}
                      pointerEvents="none"
                    >
                      <Svg
                        width={displaySize.width}
                        height={displaySize.height}
                        style={{ position: "absolute" }}
                      >
                        {displayPath && displayPath.length > 0 && (
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
              <Pressable
                onPress={clearPath}
                disabled={path.length === 0}
                style={{
                  paddingVertical: spacing.sm,
                  paddingHorizontal: spacing.md,
                  backgroundColor:
                    path.length > 0 ? colors.overlay : colors.border,
                  borderRadius: 8,
                  opacity: path.length > 0 ? 1 : 0.5,
                }}
              >
                <Text style={{ color: colors.text }}>Clear</Text>
              </Pressable>
              {path.length > 0 && (
                <Pressable
                  onPress={toggleEditMode}
                  style={{
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.md,
                    backgroundColor: editMode ? colors.primary : colors.overlay,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: colors.text }}>
                    {editMode ? "Done Edit" : "Edit"}
                  </Text>
                </Pressable>
              )}
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
              <Pressable
                onPress={confirm}
                disabled={path.length < 3}
                style={{
                  padding: spacing.md,
                  opacity: path.length >= 3 ? 1 : 0.5,
                }}
              >
                <Text
                  style={{
                    color: path.length >= 3 ? colors.text : colors.textMuted,
                  }}
                >
                  Done
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
};
