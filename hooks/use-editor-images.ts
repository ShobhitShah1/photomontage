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

      const newImages = mapAssetsToImages(assets, source);
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
