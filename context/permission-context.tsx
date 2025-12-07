import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { useRouter, useSegments } from "expo-router";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { AppState } from "react-native";

interface PermissionContextType {
  cameraGranted: boolean;
  libraryGranted: boolean;
  allPermissionsGranted: boolean;
  requestPermissions: () => Promise<boolean>;
  requestCameraPermission: () => Promise<boolean>;
  requestLibraryPermission: () => Promise<boolean>;
  checkPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType>({
  cameraGranted: false,
  libraryGranted: false,
  allPermissionsGranted: false,
  requestPermissions: async () => false,
  requestCameraPermission: async () => false,
  requestLibraryPermission: async () => false,
  checkPermissions: async () => {},
});

export const usePermissions = () => useContext(PermissionContext);

export function PermissionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cameraGranted, setCameraGranted] = useState(false);
  const [libraryGranted, setLibraryGranted] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const router = useRouter();
  const segments = useSegments();

  const checkPermissions = useCallback(async () => {
    const cameraStatus = await ImagePicker.getCameraPermissionsAsync();
    const libraryStatus = await MediaLibrary.getPermissionsAsync();

    const isCameraGranted = cameraStatus.status === "granted";
    const isLibraryGranted = libraryStatus.status === "granted";

    setCameraGranted(isCameraGranted);
    setLibraryGranted(isLibraryGranted);
  }, []);

  const requestCameraPermission = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    const isGranted = status === "granted";
    setCameraGranted(isGranted);
    return isGranted;
  }, []);

  const requestLibraryPermission = useCallback(async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    const isGranted = status === "granted";
    setLibraryGranted(isGranted);
    return isGranted;
  }, []);

  const requestPermissions = useCallback(async () => {
    const camera = await requestCameraPermission();
    const library = await requestLibraryPermission();
    return camera && library;
  }, [requestCameraPermission, requestLibraryPermission]);

  useEffect(() => {
    checkPermissions().finally(() => setIsReady(true));
  }, [checkPermissions]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        checkPermissions();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [checkPermissions]);

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === "(tabs)";
    const allGranted = cameraGranted && libraryGranted;

    if (!allGranted && inAuthGroup) {
      router.replace("/permissions");
    } else if (allGranted && segments[0] === "permissions") {
      router.replace("/(tabs)");
    }
  }, [isReady, segments, cameraGranted, libraryGranted, router]);

  const value = {
    cameraGranted,
    libraryGranted,
    allPermissionsGranted: cameraGranted && libraryGranted,
    requestPermissions,
    checkPermissions,
    requestCameraPermission,
    requestLibraryPermission,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}
