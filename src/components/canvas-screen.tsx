import { CanvasImage } from "@/components/canvas/canvas-image";
import { mapAssetsToImages, useSelectionStore } from "@/store/selection-store";
import * as ImageManipulator from "expo-image-manipulator";
import type { ImagePickerAsset } from "expo-image-picker";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ViewShot from "react-native-view-shot";
import EmptyCanvasState from "../../components/empty-canvas-state";
import { exportComposition } from "../../services/export-service";
import { Layer, useEditorStore } from "../../store/store";
import { colors, radii, spacing } from "../theme/tokens";
import { Cropper } from "./cropper";
import { GridOverlay } from "./grid-overlay";
import { ImagePickerModal } from "./image-picker-modal";
import { SelectionStrip } from "./selection-strip";
import { Toolbar } from "./toolbar";

export const CanvasScreen: React.FC = () => {
  const { width: screenW, height: screenH } = useWindowDimensions();
  const [canvasSize, setCanvasSize] = useState({
    width: screenW,
    height: screenH,
  });

  const viewRef = useRef<ViewShot>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [cropLayerId, setCropLayerId] = useState<string | null>(null);
  const {
    canvas,
    setCanvas,
    layers,
    selectedLayerId,
    selectLayer,
    updateLayer,
    addLayers,
    ui,
    toggleGrid,
    undo,
    redo,
    randomizeLayers,
  } = useEditorStore();
  const appendSelection = useSelectionStore((state) => state.appendImages);
  const setActiveImage = useSelectionStore((state) => state.setActive);
  const selectionImages = useSelectionStore((state) => state.images);
  const activeSelectionId = useSelectionStore((state) => state.activeId);

  React.useEffect(() => {
    setCanvas({ width: canvasSize.width, height: canvasSize.height });
  }, [canvasSize.width, canvasSize.height]);

  useEffect(() => {
    setActiveImage(selectedLayerId);
  }, [selectedLayerId, setActiveImage]);

  const onPicked = async (
    assets: ImagePickerAsset[],
    source: "library" | "camera"
  ) => {
    const prepared = mapAssetsToImages(assets, source);
    if (prepared.length === 0) {
      return;
    }
    const next: Layer[] = [];
    const enriched: typeof prepared = [];
    for (let i = 0; i < prepared.length; i++) {
      const image = prepared[i];
      let thumbUri: string | undefined;

      try {
        const ctx = ImageManipulator.ImageManipulator.manipulate(image.uri);
        ctx.resize({ width: 512 });
        const img = await ctx.renderAsync();
        const saved = await img.saveAsync({
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        });
        thumbUri = saved.uri;
      } catch {}

      const baseW = Math.min(canvasSize.width * 0.6, image.width ?? 800);
      const baseH = Math.min(canvasSize.height * 0.6, image.height ?? 800);
      const enrichedImage = { ...image, thumbUri };
      enriched.push(enrichedImage);
      next.push({
        id: enrichedImage.id,
        originalUri: enrichedImage.uri,
        thumbUri: enrichedImage.thumbUri,
        x: 20 + i * 10,
        y: 20 + i * 10,
        scale: 1,
        rotation: 0,
        width: baseW,
        height: baseH,
        z: i + 1,
      });
    }
    appendSelection(enriched);
    addLayers(next);
    setActiveImage(enriched.at(-1)?.id ?? null);
  };

  const handleSelect = useCallback(
    (id: string | null) => {
      selectLayer(id);
      setActiveImage(id);
    },
    [selectLayer, setActiveImage]
  );

  const handleStripSelect = useCallback(
    (id: string) => {
      handleSelect(id);
    },
    [handleSelect]
  );

  const exportImage = async () => {
    if (!viewRef.current) {
      return;
    }

    try {
      const uri = await exportComposition({
        viewRef: viewRef,
        width: canvasSize.width,
        height: canvasSize.height,
        scaleFactor: 2,
      });

      Alert.alert("Saved", uri?.toString(), [
        { text: "Okay, thanks!", onPress: () => {} },
      ]);
    } catch (e) {
      console.warn(String(e));
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flex: 1 }}>
        <View
          style={{ flex: 1 }}
          onLayout={(e) =>
            setCanvasSize({
              width: Math.round(e.nativeEvent.layout.width),
              height: Math.round(e.nativeEvent.layout.height),
            })
          }
        >
          <ViewShot
            ref={viewRef}
            style={{
              flex: 1,
              backgroundColor: colors.surface,
              overflow: "hidden",
            }}
          >
            <View style={{ flex: 1 }}>
              <GridOverlay
                width={canvasSize.width}
                height={canvasSize.height}
                spacing={ui.gridSize}
                visible={ui.grid}
              />
              {layers
                .slice()
                .sort((a, b) => a.z - b.z)
                .map((l) => (
                  <CanvasImage
                    key={l.id}
                    layer={l}
                    isSelected={l.id === selectedLayerId}
                    onSelect={handleSelect}
                    onChange={(nl) => updateLayer(l.id, nl)}
                    onRequestCrop={(id) => setCropLayerId(id)}
                  />
                ))}
              {layers.length === 0 && <EmptyCanvasState />}
            </View>
          </ViewShot>
        </View>
      </View>
      <View style={styles.bottomContainer}>
        {selectionImages.length > 0 && (
          <View style={styles.stripContainer}>
            <SelectionStrip
              images={selectionImages}
              activeId={activeSelectionId}
              onSelect={handleStripSelect}
            />
          </View>
        )}
        <View style={styles.toolBarContainer}>
          <Toolbar
            onAdd={() => setPickerVisible(true)}
            onUndo={undo}
            onRedo={redo}
            onGridToggle={toggleGrid}
            onRandomize={randomizeLayers}
            onExport={exportImage}
          />
        </View>
      </View>

      <ImagePickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onPicked={onPicked}
      />

      {cropLayerId &&
        (() => {
          const layer = layers.find((l) => l.id === cropLayerId);
          if (!layer) return null as any;
          return (
            <Cropper
              visible={true}
              uri={layer.originalUri}
              onCancel={() => setCropLayerId(null)}
              onDone={({
                uri,
                maskPath,
                bounds,
                croppedWidth,
                croppedHeight,
              }) => {
                updateLayer(layer.id, {
                  croppedUri: uri,
                  maskPath,
                  maskBounds: bounds,
                  width: croppedWidth,
                  height: croppedHeight,
                });
                setCropLayerId(null);
              }}
            />
          );
        })()}
    </SafeAreaView>
  );
};

export const styles = StyleSheet.create({
  bottomContainer: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
  },
  stripContainer: {
    backgroundColor: colors.surface,
    borderColor: "#fff",
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    boxShadow: "0px 0px 10px 0.5px rgba(255,255,255,0.5)",
  },
  toolBarContainer: {
    backgroundColor: colors.surface,
    borderColor: "#fff",
    borderWidth: 1,
    borderRadius: radii.lg,
    boxShadow: "0px 0px 10px 0.5px rgba(255,255,255,0.5)",
  },
});
