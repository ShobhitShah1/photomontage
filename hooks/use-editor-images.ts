import type { SelectionSource } from "@/store/selection-store";
import {
  mapAssetsToImages,
  useSelectionStore,
  type PickedImage,
} from "@/store/selection-store";
import { useEditorStore } from "@/store/store";
import {
  assignZIndexToLayers,
  createLayersFromImages,
} from "@/utiles/editor-utils";
import type { ImagePickerAsset } from "expo-image-picker";
import { Alert } from "react-native";
import { useCallback } from "react";

interface UseEditorImagesOptions {
  canvasWidth: number;
  canvasHeight: number;
}

interface UseEditorImagesReturn {
  handleImagePicked: (
    assets: ImagePickerAsset[],
    source: SelectionSource
  ) => void;
  handleImageDelete: (image: PickedImage) => void;
}

export const useEditorImages = (
  options: UseEditorImagesOptions
): UseEditorImagesReturn => {
  const { canvasWidth, canvasHeight } = options;
  const {
    appendImages,
    remove: removeImage,
    images,
    setActive,
  } = useSelectionStore();
  const { layers, addLayers, removeLayer, selectLayer } = useEditorStore();

  const handleImagePicked = useCallback(
    (assets: ImagePickerAsset[], source: SelectionSource) => {
      if (assets.length === 0) return;

      const MAX_DIMENSION = 6000;
      const MAX_PIXELS = 24_000_000; // 24 MP

      const oversizedAssets: ImagePickerAsset[] = [];
      const safeAssets = assets.filter((asset) => {
        const width = asset.width ?? 0;
        const height = asset.height ?? 0;
        if (!width || !height) return true;
        if (
          width > MAX_DIMENSION ||
          height > MAX_DIMENSION ||
          width * height > MAX_PIXELS
        ) {
          oversizedAssets.push(asset);
          return false;
        }
        return true;
      });

      if (oversizedAssets.length > 0) {
        Alert.alert(
          "Image Too Large",
          "One or more selected images exceed the maximum supported size (24 MP or 6000px in any dimension). Please select a smaller image."
        );
      }

      if (safeAssets.length === 0) return;

      const newImages = mapAssetsToImages(safeAssets, source);
      appendImages(newImages);

      const newLayers = createLayersFromImages(
        newImages,
        canvasWidth,
        canvasHeight
      );

      const layersWithZ = assignZIndexToLayers(newLayers, layers);

      addLayers(layersWithZ);
      if (layersWithZ.length > 0) {
        selectLayer(layersWithZ[0].id);
        setActive(layersWithZ[0].id);
      }
    },
    [
      canvasWidth,
      canvasHeight,
      appendImages,
      layers,
      addLayers,
      selectLayer,
      setActive,
    ]
  );

  const handleImageDelete = useCallback(
    (image: PickedImage) => {
      removeImage(image.id);
      removeLayer(image.id);

      const remainingImages = images.filter((img) => img.id !== image.id);
      if (remainingImages.length > 0) {
        selectLayer(remainingImages[0].id);
        setActive(remainingImages[0].id);
      } else {
        selectLayer(null);
        setActive(null);
      }
    },
    [images, removeImage, removeLayer, selectLayer, setActive]
  );

  return {
    handleImagePicked,
    handleImageDelete,
  };
};
