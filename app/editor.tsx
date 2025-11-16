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
import { SafeAreaView } from "react-native-safe-area-context";
import ViewShot from "react-native-view-shot";

import { CanvasImage } from "@/components/canvas/canvas-image";
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
import { useEditorImages } from "@/hooks/use-editor-images";
import { DownloadProgress, DownloadService } from "@/services/download-service";
import { useSelectionStore } from "@/store/selection-store";
import { useEditorStore } from "@/store/store";
import { ImagePickerModal } from "@/temp/components/image-picker-modal";
import { useIsFocused } from "@react-navigation/native";
import * as ImageManipulator from "expo-image-manipulator";
import { useFocusEffect, useRouter } from "expo-router";

const createLayersFromImages = (
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

  const [downloadProgress, setDownloadProgress] =
    useState<DownloadProgress | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

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
    applyCrop,
    undo,
    redo,
    reset,
    randomizeLayers: shuffle,
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
    if (nextLayers.length > 0) selectLayer(nextLayers[0].id);
    hydratedSession.current = sessionId;
  }, [
    sessionId,
    images,
    reset,
    addLayers,
    selectLayer,
    canvasSize.width,
    canvasSize.height,
  ]);

  const sortedLayers = useMemo(
    () => [...layers].sort((a, b) => a.z - b.z),
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

        setTimeout(() => {
          setDownloadProgress(null);
          setIsDownloading(false);
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
    async (result: {
      croppedUri: string;
      maskPath: string;
      cropRect: { x: number; y: number; width: number; height: number };
    }) => {
      if (!selectedLayerId || !selectedLayer) return;

      try {
        const imageInfo = await ImageManipulator.manipulateAsync(
          result.croppedUri,
          [],
          { compress: 1, format: ImageManipulator.SaveFormat.PNG }
        );

        const actualWidth = imageInfo.width || result.cropRect.width;
        const actualHeight = imageInfo.height || result.cropRect.height;

        const currentX = selectedLayer.x;
        const currentY = selectedLayer.y;
        const currentWidth = selectedLayer.width;
        const currentHeight = selectedLayer.height;

        const centerX = currentX + currentWidth / 2;
        const centerY = currentY + currentHeight / 2;

        const newX = centerX - actualWidth / 2;
        const newY = centerY - actualHeight / 2;

        const updatedCropRect = {
          ...result.cropRect,
          width: actualWidth,
          height: actualHeight,
        };

        applyCrop(selectedLayerId, result.croppedUri, updatedCropRect);
        updateLayer(selectedLayerId, {
          maskPath: result.maskPath,
          width: actualWidth,
          height: actualHeight,
          x: Math.max(0, newX),
          y: Math.max(0, newY),
        });
        setisDetailEditingEnable(false);
      } catch (error) {
        console.error("Error getting cropped image dimensions:", error);
        const newWidth = result.cropRect.width;
        const newHeight = result.cropRect.height;

        const centerX = selectedLayer.x + selectedLayer.width / 2;
        const centerY = selectedLayer.y + selectedLayer.height / 2;

        const newX = centerX - newWidth / 2;
        const newY = centerY - newHeight / 2;

        applyCrop(selectedLayerId, result.croppedUri, result.cropRect);
        updateLayer(selectedLayerId, {
          maskPath: result.maskPath,
          width: newWidth,
          height: newHeight,
          x: Math.max(0, newX),
          y: Math.max(0, newY),
        });
        setisDetailEditingEnable(false);
      }
    },
    [selectedLayerId, selectedLayer, applyCrop, updateLayer]
  );

  const handleCropCancel = useCallback(() => {
    setisDetailEditingEnable(false);
    setSelectedAspectRatio("free");
    setEditingActions(null);
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
                  {
                    text: "Cancel",
                    style: "cancel",
                  },
                  {
                    text: "Discard",
                    style: "destructive",
                    onPress: () => {
                      handleCropCancel();
                    },
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
                {
                  text: "Cancel",
                  style: "cancel",
                },
                {
                  text: "Discard",
                  style: "destructive",
                  onPress: () => {
                    router.replace("/");
                  },
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

  const handleUndo = useCallback(() => {
    undo();
  }, [undo]);

  const handelShuffle = useCallback(() => {
    shuffle();
  }, [shuffle]);

  const handleRedo = useCallback(() => {
    redo();
  }, [redo]);

  const handleDownload = useCallback(() => {
    setShowQualityModal(true);
  }, []);

  const handleCompleteEditing = useCallback(() => {
    handleCropCancel();
  }, [handleCropCancel]);

  return (
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
                onSelect={() => {}}
                // onRequestCrop={() =>
                //   setisDetailEditingEnable(!isDetailEditingEnable)
                // }
                // onSelect={handleSelectLayer}
                isSelected={false}
                // isSelected={layer.id === selectedLayerId}
                onChange={(next) => updateLayer(layer.id, next)}
              />
            ))
          )}
        </ViewShot>
      </View>

      <EditorBottomBar
        images={images}
        onImageSelect={(image, index) => {
          if (!image) return;

          handleSelectLayer(image.id);
          setisDetailEditingEnable(true);
        }}
        onImageDelete={handleImageDelete}
        onUploadPress={() => setPickerVisible(true)}
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
            setTimeout(() => {
              setDownloadProgress(null);
            }, 300);
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingVertical: 5 },
  canvasWrapper: { flex: 1 },
  canvas: { flex: 1, overflow: "hidden" },
});
