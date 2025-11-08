import * as ImageManipulator from "expo-image-manipulator";
import React, { useRef, useState } from "react";
import { Alert, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ViewShot from "react-native-view-shot";
import { exportComposition } from "../services/export-service";
import { Layer, useEditorStore } from "../state/store";
import { colors, radii, spacing } from "../theme/tokens";
import { CanvasImage } from "./canvas-image";
import { Cropper } from "./cropper";
import EmptyCanvasState from "./empty-canvas-state";
import { GridOverlay } from "./grid-overlay";
import { ImagePickerModal } from "./image-picker-modal";
import { Toolbar } from "./toolbar";

export const CanvasScreen: React.FC = () => {
  const { width: screenW, height: screenH } = useWindowDimensions();
  const [canvasSize, setCanvasSize] = React.useState({
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

  React.useEffect(() => {
    setCanvas({ width: canvasSize.width, height: canvasSize.height });
  }, [canvasSize.width, canvasSize.height]);

  const onPicked = async (
    assets: { uri: string; width?: number; height?: number }[]
  ) => {
    const next: Layer[] = [];
    for (let i = 0; i < assets.length; i++) {
      const a = assets[i];
      let thumbUri: string | undefined;
      try {
        const ctx = ImageManipulator.ImageManipulator.manipulate(a.uri);
        ctx.resize({ width: 512 });
        const img = await ctx.renderAsync();
        const saved = await img.saveAsync({
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        });
        thumbUri = saved.uri;
      } catch {}
      const baseW = Math.min(canvasSize.width * 0.6, a.width ?? 800);
      const baseH = Math.min(canvasSize.height * 0.6, a.height ?? 800);
      next.push({
        id: `${Date.now()}-${i}`,
        originalUri: a.uri,
        thumbUri,
        x: 20 + i * 10,
        y: 20 + i * 10,
        scale: 1,
        rotation: 0,
        width: baseW,
        height: baseH,
        z: i + 1,
      });
    }
    addLayers(next);
  };

  const exportImage = async () => {
    if (!viewRef.current) return;
    try {
      const uri = await exportComposition({
        viewRef: viewRef,
        width: canvasSize.width,
        height: canvasSize.height,
        scaleFactor: 2,
      });
      console.log("saved:", uri);
      Alert.alert("Saved", uri?.toString(), [
        {
          text: "Okay, thanks!",
          onPress: () => {},
        },
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
                    onSelect={(id) => selectLayer(id)}
                    onChange={(nl) => updateLayer(l.id, nl)}
                    onRequestCrop={(id) => setCropLayerId(id)}
                  />
                ))}
              {layers.length === 0 && <EmptyCanvasState />}
            </View>
          </ViewShot>
        </View>
      </View>
      <View
        style={{
          position: "absolute",
          left: spacing.md,
          right: spacing.md,
          bottom: spacing.md,
          backgroundColor: colors.surface,
          borderColor: "#fff",
          borderWidth: 1,
          borderRadius: radii.lg,
          boxShadow: "0px 0px 10px 0.5px rgba(255,255,255,0.5)",
        }}
      >
        <Toolbar
          onAdd={() => setPickerVisible(true)}
          onUndo={undo}
          onRedo={redo}
          onGridToggle={toggleGrid}
          onRandomize={randomizeLayers}
          onExport={exportImage}
        />
      </View>

      <ImagePickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onPicked={onPicked as any}
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
              onDone={({ uri, rect }) => {
                updateLayer(layer.id, { croppedUri: uri, cropRect: rect });
                setCropLayerId(null);
              }}
            />
          );
        })()}
    </SafeAreaView>
  );
};
