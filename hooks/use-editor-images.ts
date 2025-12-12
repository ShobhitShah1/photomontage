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
import {
  filterPickerAssets,
  hasValidDimensions,
  showInvalidDimensionsAlert,
  showOversizedImageAlert,
} from "@/utiles/image-validation";
import type { ImagePickerAsset } from "expo-image-picker";
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

      const { validImages, invalidCount, hasInvalid } =
        filterPickerAssets(assets);

      if (hasInvalid) {
        showOversizedImageAlert(invalidCount);
      }

      if (validImages.length === 0) {
        const hasAnyWithBadDimensions = assets.some(
          (a) => !hasValidDimensions(a.width ?? 0, a.height ?? 0)
        );
        if (assets.length > 0 && !hasInvalid && hasAnyWithBadDimensions) {
          showInvalidDimensionsAlert();
        }
        return;
      }

      const newImages = mapAssetsToImages(validImages, source);
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
