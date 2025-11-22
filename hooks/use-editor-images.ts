import { createLayersFromImages } from "@/app/editor";
import type { SelectionSource } from "@/store/selection-store";
import {
  mapAssetsToImages,
  useSelectionStore,
  type PickedImage,
} from "@/store/selection-store";
import { useEditorStore } from "@/store/store";
import { assignZIndexToLayers } from "@/utiles/editor-utils";
import type { ImagePickerAsset } from "expo-image-picker";
import { useCallback } from "react";
import { Alert } from "react-native";

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

        if (!width || !height || width <= 0 || height <= 0) {
          console.error("Asset has invalid dimensions:", asset.uri, {
            width,
            height,
          });
          return false;
        }

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

      if (safeAssets.length === 0) {
        if (assets.length > 0 && oversizedAssets.length === 0) {
          Alert.alert(
            "Invalid Images",
            "Selected images have invalid dimensions. Please try different images."
          );
        }
        return;
      }

      const newImages = mapAssetsToImages(safeAssets, source);
      appendImages(newImages);

      const newLayers = createLayersFromImages(
        newImages,
        canvasWidth,
        canvasHeight
      );

      const validLayers = newLayers.filter((layer) => {
        const isValid =
          layer.width > 0 &&
          layer.height > 0 &&
          Number.isFinite(layer.width) &&
          Number.isFinite(layer.height) &&
          Number.isFinite(layer.x) &&
          Number.isFinite(layer.y);

        if (!isValid) {
          console.error("Layer has invalid dimensions:", {
            id: layer.id,
            width: layer.width,
            height: layer.height,
            x: layer.x,
            y: layer.y,
          });
        }

        return isValid;
      });

      if (validLayers.length === 0) {
        Alert.alert(
          "Error",
          "Failed to create layers from images. Please try again."
        );
        return;
      }

      const layersWithZ = assignZIndexToLayers(validLayers, layers);

      const finalValidLayers = layersWithZ.filter(
        (layer) =>
          layer.width > 0 &&
          layer.height > 0 &&
          Number.isFinite(layer.width) &&
          Number.isFinite(layer.height)
      );

      if (finalValidLayers.length > 0) {
        addLayers(finalValidLayers);
        selectLayer(finalValidLayers[0].id);
        setActive(finalValidLayers[0].id);
      } else {
        Alert.alert(
          "Error",
          "Could not add images to canvas. Please try again."
        );
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
