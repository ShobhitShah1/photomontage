import { exportComposition } from "@/services/export-service";
import { useCallback } from "react";
import { Alert } from "react-native";

interface ExportImageProps {
  viewRef: React.RefObject<any>;
  canvasSize: {
    width: number;
    height: number;
  };
}

export const useExportImage = ({ viewRef, canvasSize }: ExportImageProps) => {
  const handleExport = useCallback(async () => {
    if (!viewRef.current) {
      return;
    }

    try {
      const uri = await exportComposition({
        viewRef,
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
  }, [viewRef, canvasSize]);

  return handleExport;
};
