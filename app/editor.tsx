import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  BackHandler,
  LayoutChangeEvent,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import ViewShot from "react-native-view-shot";

import { CanvasImage } from "@/components/canvas/canvas-image";
import { MiniCanvasPreview } from "@/components/canvas/mini-canvas-preview";
import { DetailEditingView } from "@/components/editor/detail-editing-view";
import EditorBottomBar from "@/components/editor/editor-bottom-bar";
import EditorTopBar from "@/components/editor/editor-top-bar";
import EmptyCanvasState from "@/components/empty-canvas-state";
import { View } from "@/components/themed";

import { DownloadModal } from "@/components/download-modal";
import {
  QualityOption,
  QualitySelectionModal,
} from "@/components/quality-selection-modal";
import { ShareImageModal } from "@/components/share-image-modal";
import { useEditorImages } from "@/hooks/use-editor-images";
import { DownloadProgress, DownloadService } from "@/services/download-service";
import { useSelectionStore } from "@/store/selection-store";
import { useEditorStore } from "@/store/store";
import { ImagePickerModal } from "@/temp/components/image-picker-modal";
import { useIsFocused } from "@react-navigation/native";
import { useFocusEffect, useRouter } from "expo-router";

// --- Draggable Preview Component ---

interface DraggablePreviewProps {
  children: React.ReactNode;
  containerWidth: number;
  containerHeight: number;
  itemWidth: number;
  itemHeight: number;
}

const DraggablePreview = ({
  children,
  containerWidth,
  containerHeight,
  itemWidth,
  itemHeight,
}: DraggablePreviewProps) => {
  const isExpanded = useSharedValue(false);
  const isHidden = useSharedValue(false);

  const x = useSharedValue(20);
  const y = useSharedValue(containerHeight - itemHeight - 20);
  const context = useSharedValue({ x: 0, y: 0 });

  const MAX_X = containerWidth - itemWidth;
  const MAX_Y = containerHeight - itemHeight;

  const animationConfig = {
    duration: 350,
    easing: Easing.out(Easing.cubic),
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      if (isExpanded.value) return;
      context.value = { x: x.value, y: y.value };
    })
    .onUpdate((e) => {
      if (isExpanded.value) return;
      const nextX = context.value.x + e.translationX;
      const nextY = context.value.y + e.translationY;
      x.value = Math.min(Math.max(nextX, 0), MAX_X);
      y.value = Math.min(Math.max(nextY, 0), MAX_Y);
    });

  const tapGesture = Gesture.Tap()
    .maxDuration(250)
    .onEnd(() => {
      isExpanded.value = !isExpanded.value;
    });

  const longPressGesture = Gesture.LongPress()
    .minDuration(400)
    .onStart(() => {
      isHidden.value = true;
    })
    .onFinalize(() => {
      isHidden.value = false;
    });

  const composedGestures = Gesture.Simultaneous(
    panGesture,
    tapGesture,
    longPressGesture
  );

  const animatedStyle = useAnimatedStyle(() => {
    const scaleRatio = Math.min(
      (containerWidth * 0.9) / itemWidth,
      (containerHeight * 0.8) / itemHeight
    );

    const targetScale = isExpanded.value ? scaleRatio : 1;

    const centerX = (containerWidth - itemWidth) / 2;
    const centerY = (containerHeight - itemHeight) / 2;

    const targetX = isExpanded.value ? centerX : x.value;
    const targetY = isExpanded.value ? centerY : y.value;

    return {
      transform: [
        { translateX: withTiming(targetX, animationConfig) },
        { translateY: withTiming(targetY, animationConfig) },
        { scale: withTiming(targetScale, animationConfig) },
      ],
      opacity: withTiming(isHidden.value ? 0 : 1, { duration: 200 }),
      zIndex: isExpanded.value ? 9999 : 100,
    };
  });

  return (
    <GestureDetector gesture={composedGestures}>
      <Animated.View
        style={[
          styles.previewContainer,
          { width: itemWidth, height: itemHeight },
          animatedStyle,
        ]}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
};

export const createLayersFromImages = (
  images: any[],
  canvasWidth: number,
  canvasHeight: number
) => {
  return images.map((image, index) => {
    const imgWidth = image.width || 640;
    const imgHeight = image.height || 640;

    const maxWidth = canvasWidth * 0.6;
    const maxHeight = canvasHeight * 0.6;

    let displayWidth = imgWidth;
    let displayHeight = imgHeight;

    if (imgWidth > maxWidth || imgHeight > maxHeight) {
      const scaleW = maxWidth / imgWidth;
      const scaleH = maxHeight / imgHeight;
      const scale = Math.min(scaleW, scaleH);
      displayWidth = imgWidth * scale;
      displayHeight = imgHeight * scale;
    }

    const x = (canvasWidth - displayWidth) / 2 + index * 20;
    const y = (canvasHeight - displayHeight) / 2 + index * 20;

    return {
      id: image.id,
      originalUri: image.uri,
      x: Math.max(0, x),
      y: Math.max(0, y),
      scale: 1,
      rotation: 0,
      width: displayWidth,
      height: displayHeight,
      z: index + 1,
    };
  });
};

export default function EditorScreen() {
  const isFocus = useIsFocused();
  const router = useRouter();
  const viewRef = useRef<ViewShot>(null);
  const hydratedSession = useRef<string | null>(null);
  const { width: screenW, height: screenH } = useWindowDimensions();

  const [canvasSize, setCanvasSize] = useState({
    width: screenW,
    height: screenH,
  });

  const [pickerVisible, setPickerVisible] = useState(false);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [isDetailEditingEnable, setisDetailEditingEnable] = useState(false);

  const [downloadedImageUri, setDownloadedImageUri] = useState<string>("");
  const [downloadProgress, setDownloadProgress] =
    useState<DownloadProgress | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showShareImage, setShowShareImage] = useState(false);

  const [selectedAspectRatio, setSelectedAspectRatio] = useState<
    "free" | "1:1" | "3:2" | "4:3" | "16:9"
  >("free");
  const [editingActions, setEditingActions] = useState<{
    clearPath: () => void;
    toggleEditMode: () => void;
    applyCrop: () => void;
    canApply: boolean;
    hasPath: boolean;
    isEditMode: boolean;
  } | null>(null);

  const { sessionId, images, setActive } = useSelectionStore();
  const {
    layers,
    selectedLayerId,
    selectLayer,
    updateLayer,
    addLayers,
    undo,
    redo,
    reset,
    randomizeLayers: shuffle,
    bringToFront,
    sendToBack,
  } = useEditorStore();

  const { handleImagePicked, handleImageDelete } = useEditorImages({
    canvasWidth: canvasSize.width,
    canvasHeight: canvasSize.height,
  });

  useFocusEffect(
    useCallback(() => {
      if (images.length === 0) router.replace("/preview");
    }, [images.length, router])
  );

  useEffect(() => {
    if (!sessionId || images.length === 0) return;
    if (hydratedSession.current === sessionId) return;

    reset();
    const nextLayers = createLayersFromImages(
      images,
      canvasSize.width,
      canvasSize.height
    );
    addLayers(nextLayers);
    hydratedSession.current = sessionId;
  }, [
    sessionId,
    images,
    reset,
    addLayers,
    canvasSize.width,
    canvasSize.height,
  ]);

  const sortedLayers = useMemo(
    () => layers.filter((layer) => layer.croppedUri || layer.maskPath),
    [layers]
  );

  const handleCanvasLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setCanvasSize({ width, height });
  }, []);

  const handleSelectLayer = useCallback(
    (id: string | null) => {
      selectLayer(id);
      setActive(id);
    },
    [selectLayer, setActive]
  );

  const selectedLayer = useMemo(
    () => layers.find((l) => l.id === selectedLayerId),
    [layers, selectedLayerId]
  );

  const handleQualitySelect = async (quality: QualityOption) => {
    try {
      setActive(null);
      setIsDownloading(true);
      setDownloadProgress({
        progress: 0,
        stage: "preparing",
        message: "Starting download...",
      });

      setShowQualityModal(false);

      viewRef.current?.capture?.().then(async (uri) => {
        await DownloadService.downloadWithQuality(uri, quality, (progress) =>
          setDownloadProgress(progress)
        );

        setDownloadProgress({
          progress: 1,
          stage: "complete",
          message: "Download complete!",
        });

        setDownloadedImageUri(uri);

        setTimeout(() => {
          setDownloadProgress(null);
          setIsDownloading(false);
          setShowShareImage(true);
        }, 2000);
      });
    } catch (error) {
      setDownloadProgress(null);
      setIsDownloading(false);
      Alert.alert(
        "Download Failed",
        "Failed to download image. Please try again."
      );
    }
  };

  const handleCropComplete = useCallback(
    (result: {
      croppedUri: string;
      maskPath: string;
      cropRect: { x: number; y: number; width: number; height: number };
    }) => {
      if (!selectedLayerId || !selectedLayer) return;

      try {
        const actualWidth = result.cropRect.width;
        const actualHeight = result.cropRect.height;

        if (
          !actualWidth ||
          !actualHeight ||
          actualWidth <= 0 ||
          actualHeight <= 0
        ) {
          Alert.alert("Error", "Invalid crop dimensions");
          return;
        }

        if (!selectedLayer.width || !selectedLayer.height) {
          Alert.alert("Error", "Invalid layer state");
          return;
        }

        const currentX = selectedLayer.x || 0;
        const currentY = selectedLayer.y || 0;
        const currentWidth = selectedLayer.width;
        const currentHeight = selectedLayer.height;
        const centerX = currentX + currentWidth / 2;
        const centerY = currentY + currentHeight / 2;
        const newX = centerX - actualWidth / 2;
        const newY = centerY - actualHeight / 2;

        const updatedCropRect = {
          x: result.cropRect.x || 0,
          y: result.cropRect.y || 0,
          width: actualWidth,
          height: actualHeight,
        };

        updateLayer(selectedLayerId, {
          croppedUri: result.croppedUri,
          cropRect: updatedCropRect,
          maskPath: result.maskPath,
          width: actualWidth,
          height: actualHeight,
          x: Math.max(0, newX),
          y: Math.max(0, newY),
        });

        setisDetailEditingEnable(false);
        selectLayer(null);
      } catch (error) {
        console.error("Error applying crop:", error);
        Alert.alert("Error", "Failed to apply crop. Please try again.");
      }
    },
    [selectedLayerId, selectedLayer, updateLayer, selectLayer]
  );

  const handleCropCancel = useCallback(() => {
    setisDetailEditingEnable(false);
    setSelectedAspectRatio("free");
    setEditingActions(null);
    selectLayer("");
  }, []);

  const handleAspectRatioChange = useCallback(
    (aspectRatio: "free" | "1:1" | "3:2" | "4:3" | "16:9") => {
      setSelectedAspectRatio(aspectRatio);
    },
    []
  );

  useEffect(() => {
    if (!isDetailEditingEnable) {
      setSelectedAspectRatio("free");
    }
  }, [isDetailEditingEnable]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (isFocus) {
          if (isDetailEditingEnable) {
            const hasUnsavedChanges =
              editingActions?.hasPath && editingActions.hasPath;

            if (hasUnsavedChanges) {
              Alert.alert(
                "Discard Changes?",
                "You have unsaved changes. Do you want to discard them?",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Discard",
                    style: "destructive",
                    onPress: () => handleCropCancel(),
                  },
                ]
              );
              return true;
            } else {
              handleCropCancel();
              return true;
            }
          } else {
            Alert.alert(
              "Discard Changes?",
              "Do you want to discard all changes and go back?",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Discard",
                  style: "destructive",
                  onPress: () => router.replace("/"),
                },
              ]
            );
            return true;
          }
        }
        return false;
      }
    );

    return () => backHandler.remove();
  }, [isDetailEditingEnable, editingActions, handleCropCancel, router]);

  const handleUndo = useCallback(() => undo(), [undo]);
  const handelShuffle = useCallback(() => shuffle(), [shuffle]);
  const handleRedo = useCallback(() => redo(), [redo]);
  const handleDownload = useCallback(() => setShowQualityModal(true), []);
  const handleCompleteEditing = useCallback(
    () => handleCropCancel(),
    [handleCropCancel]
  );

  const handleBringToFront = useCallback(() => {
    if (selectedLayerId) bringToFront(selectedLayerId);
  }, [selectedLayerId, bringToFront]);

  const handleSendToBack = useCallback(() => {
    if (selectedLayerId) sendToBack(selectedLayerId);
  }, [selectedLayerId, sendToBack]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <EditorTopBar
          onRedo={handleRedo}
          onUndo={handleUndo}
          onDownload={handleDownload}
          onResizeImage={handleAspectRatioChange}
          onComplateEditing={handleCompleteEditing}
          isEditing={isDetailEditingEnable}
          editingActions={editingActions || undefined}
          onShuffle={handelShuffle}
          selectedAspect={selectedAspectRatio}
          onBringToFront={handleBringToFront}
          onSendToBack={handleSendToBack}
        />

        <View style={styles.canvasWrapper}>
          <ViewShot
            ref={viewRef}
            style={styles.canvas}
            onLayout={handleCanvasLayout}
          >
            {isDetailEditingEnable && selectedLayer ? (
              <DetailEditingView
                layer={selectedLayer}
                onComplete={handleCropComplete}
                onCancel={handleCropCancel}
                aspectRatio={selectedAspectRatio}
                onActionsReady={setEditingActions}
              />
            ) : sortedLayers.length === 0 ? (
              <EmptyCanvasState />
            ) : (
              sortedLayers.map((layer) => (
                <CanvasImage
                  key={layer.id}
                  layer={layer}
                  onRequestCrop={() => {}}
                  onSelect={() => handleSelectLayer(layer.id)}
                  isSelected={selectedLayerId === layer.id}
                  onChange={(next) => updateLayer(layer.id, next)}
                  onBringToFront={bringToFront}
                  onSendToBack={sendToBack}
                />
              ))
            )}
          </ViewShot>

          {isDetailEditingEnable &&
            sortedLayers.length > 0 &&
            canvasSize.width > 0 && (
              <DraggablePreview
                containerWidth={canvasSize.width}
                containerHeight={canvasSize.height}
                itemWidth={80}
                itemHeight={130}
              >
                <MiniCanvasPreview
                  layers={layers}
                  canvasWidth={canvasSize.width}
                  canvasHeight={canvasSize.height}
                  previewWidth={80}
                  previewHeight={130}
                  showBorder={false}
                  borderColor="transparent"
                />
              </DraggablePreview>
            )}
        </View>

        <EditorBottomBar
          images={images}
          selectedLayerId={selectedLayerId}
          onImageSelect={(image) => {
            if (!image) return;
            if (selectedLayerId === image.id) {
              setisDetailEditingEnable(false);
              handleSelectLayer("");
              return;
            }
            handleSelectLayer(image.id);
            setisDetailEditingEnable(true);
          }}
          onEditingPreviewPress={() => {
            setisDetailEditingEnable(false);
            handleSelectLayer(""); 
          }}
          onImageDelete={handleImageDelete}
          onUploadPress={() => setPickerVisible(true)}
          canvasLayers={sortedLayers}
          canvasWidth={canvasSize.width}
          canvasHeight={canvasSize.height}
        />

        <ImagePickerModal
          visible={pickerVisible}
          onClose={() => setPickerVisible(false)}
          onPicked={handleImagePicked}
        />

        <QualitySelectionModal
          visible={showQualityModal}
          onClose={() => setShowQualityModal(false)}
          onSelectQuality={handleQualitySelect}
        />

        <DownloadModal
          visible={isDownloading}
          progress={downloadProgress}
          onClose={() => {
            if (downloadProgress?.stage === "complete") {
              setIsDownloading(false);
              setTimeout(() => setDownloadProgress(null), 300);
            }
          }}
        />

        <ShareImageModal
          visible={showShareImage}
          downloadedImageUri={downloadedImageUri}
          onClose={() => router.replace("/gallery")}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingVertical: 5 },
  canvasWrapper: { flex: 1, position: "relative" },
  canvas: { flex: 1, overflow: "hidden" },
  previewContainer: {
    position: "absolute",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderRadius: 8,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
});
