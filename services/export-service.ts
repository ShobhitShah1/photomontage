import * as MediaLibrary from "expo-media-library";
import { captureRef } from "react-native-view-shot";
import { estimateMaxPixels } from "../utiles/pixel";

type ExportOptions = {
  viewRef: any;
  width: number;
  height: number;
  scaleFactor?: number;
  format?: "png" | "jpg";
};

const tryCapture = async (opts: ExportOptions, scale: number) => {
  const { viewRef, width, height, format = "png" } = opts;
  const targetW = Math.round(width * scale);
  const targetH = Math.round(height * scale);
  const max = estimateMaxPixels();
  if (targetW * targetH > max) throw new Error("target too large");
  return await captureRef(viewRef, {
    format,
    quality: 1,
    width: targetW,
    height: targetH,
    result: "tmpfile",
  });
};

export const exportComposition = async (opts: ExportOptions) => {
  const { scaleFactor = 2 } = opts;
  const attempts = [scaleFactor, 1.5, 1.25, 1];
  let uri: string | null = null;
  for (const s of attempts) {
    try {
      uri = await tryCapture(opts, s);
      break;
    } catch (_) {
      continue;
    }
  }
  if (!uri) throw new Error("capture failed");
  const perm = await MediaLibrary.requestPermissionsAsync();
  if (!perm.granted) throw new Error("media permission denied");
  const asset = await MediaLibrary.createAssetAsync(uri);
  return asset.uri;
};
