import * as ImagePicker from "expo-image-picker";
import { useCallback, useState } from "react";

interface UseImagePickerOptions {
  allowsMultipleSelection?: boolean;
  quality?: number;
  mediaTypes?: ImagePicker.MediaTypeOptions;
}

interface UseImagePickerReturn {
  pickFromLibrary: () => Promise<ImagePicker.ImagePickerAsset[] | null>;
  openCamera: () => Promise<ImagePicker.ImagePickerAsset[] | null>;
  isBusy: boolean;
}

export const useImagePicker = (
  options: UseImagePickerOptions = {}
): UseImagePickerReturn => {
  const {
    allowsMultipleSelection = true,
    quality = 1,
    mediaTypes = "images",
  } = options;

  const [isBusy, setIsBusy] = useState(false);

  const requestPermission = useCallback(
    async (
      permissionRequest: () => Promise<
        | ImagePicker.CameraPermissionResponse
        | ImagePicker.MediaLibraryPermissionResponse
      >
    ) => {
      const { granted } = await permissionRequest();
      return granted;
    },
    []
  );

  const pickFromLibrary = useCallback(async () => {
    setIsBusy(true);
    try {
      const granted = await requestPermission(
        ImagePicker.requestMediaLibraryPermissionsAsync
      );
      if (!granted) {
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection,
        mediaTypes,
        quality,
      });

      if (result.canceled) {
        return null;
      }

      return result.assets;
    } catch (error) {
      console.error("Error picking from library:", error);
      return null;
    } finally {
      setIsBusy(false);
    }
  }, [allowsMultipleSelection, mediaTypes, quality, requestPermission]);

  const openCamera = useCallback(async () => {
    setIsBusy(true);
    try {
      const granted = await requestPermission(
        ImagePicker.requestCameraPermissionsAsync
      );
      if (!granted) {
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality,
        mediaTypes,
      });

      if (result.canceled) {
        return null;
      }

      return result.assets;
    } catch (error) {
      console.error("Error opening camera:", error);
      return null;
    } finally {
      setIsBusy(false);
    }
  }, [quality, mediaTypes, requestPermission]);

  return {
    pickFromLibrary,
    openCamera,
    isBusy,
  };
};
