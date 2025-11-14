import { CanvasImage } from "@/components/canvas/canvas-image";
import EditorBottomBar from "@/components/editor/editor-bottom-bar";
import EditorTopBar from "@/components/editor/editor-top-bar";
import EmptyCanvasState from "@/components/empty-canvas-state";
import { View } from "@/components/themed";
import { useSelectionStore } from "@/store/selection-store";
import { useEditorStore } from "@/store/store";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ViewShot from "react-native-view-shot";

const clampSize = (value: number | undefined) => {
  if (!value || value <= 0) {
    return 640;
  }
  return Math.min(value, 1440);
};

export default function EditorScreen() {
  const router = useRouter();
  const viewRef = useRef<ViewShot>(null);
  const hydratedSession = useRef<string | null>(null);

  const { sessionId, images, setActive } = useSelectionStore();
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
    removeLayer,
    reset,
  } = useEditorStore();

  const [cropLayerId, setCropLayerId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (images.length === 0) {
        router.replace("/preview");
      }
    }, [images.length, router])
  );

  useEffect(() => {
    if (!sessionId || images.length === 0) {
      return;
    }

    if (hydratedSession.current === sessionId) {
      return;
    }

    reset();

    const nextLayers = images.map((image, index) => ({
      id: image.id,
      originalUri: image.uri,
      thumbUri: image.thumbUri,
      x: 40 + index * 12,
      y: 40 + index * 12,
      scale: 1,
      rotation: 0,
      width: clampSize(image.width),
      height: clampSize(image.height),
      z: index + 1,
    }));

    addLayers(nextLayers);

    if (nextLayers.length > 0) {
      selectLayer(nextLayers[0].id);
    }

    hydratedSession.current = sessionId;
  }, [sessionId, images, reset, addLayers, selectLayer]);

  const handleSelect = useCallback(
    (id: string | null) => {
      selectLayer(id);
      setActive(id);
    },
    [selectLayer, setActive]
  );

  return (
    <SafeAreaView style={styles.container}>
      <EditorTopBar
        isEditing={true}
        onComplateEditing={() => {}}
        onDownload={() => {}}
        onRedo={() => {}}
        onResizeImage={() => {}}
        onUndo={() => {}}
      />

      <View style={{ flex: 1 }}>
        <ViewShot ref={viewRef} style={{ flex: 1, overflow: "hidden" }}>
          <View style={{ flex: 1 }}>
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

      <EditorBottomBar onUploadPress={() => {}} images={images} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 5,
  },
});
