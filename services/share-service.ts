import { File } from "expo-file-system";
import { Alert } from "react-native";
import Share, { ShareSingleOptions, Social } from "react-native-share";

type SharePlatform =
  | "facebook"
  | "whatsapp"
  | "instagram"
  | "snapchat"
  | "more";

interface ShareImageOptions {
  imageUri: string;
  platform: SharePlatform;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

let shareInProgress = false;

export const shareImage = async ({
  imageUri,
  platform,
  onSuccess,
  onError,
}: ShareImageOptions) => {
  if (shareInProgress) return;

  if (!imageUri) {
    Alert.alert("Error", "Image URI is required");
    onError?.("Image URI is required");
    return;
  }

  shareInProgress = true;

  try {
    let base64Image: string | null = null;

    try {
      const file = new File(imageUri);
      const base64 = await file.base64();
      base64Image = `data:image/png;base64,${base64}`;
    } catch (e) {
      console.error("Failed to convert to base64:", e);
    }

    if (platform === "more" && base64Image) {
      await Share.open({
        url: base64Image,
        type: "image/png",
        message: "I made this with Gigglam!",
      });
      onSuccess?.();
      return;
    }

    let social: Social;

    switch (platform) {
      case "instagram":
        social = Social.Instagram;
        break;
      case "facebook":
        social = Social.Facebook;
        break;
      case "whatsapp":
        social = Social.Whatsapp;
        break;
      case "snapchat":
        social = Social.Snapchat;
        break;
      default:
        throw new Error("Unsupported platform");
    }

    const shareOptions: ShareSingleOptions = {
      url: base64Image || "",
      type: "image/*",
      social,
      filename: "shared_image.png",
      message: "I made this with Gigglam!",
    };

    await Share.shareSingle(shareOptions);
    onSuccess?.();
  } catch (error: any) {
    console.error("Share error:", error);

    const errorMsg = error?.message?.toLowerCase() || "";

    if (
      errorMsg.includes("cancel") ||
      errorMsg.includes("dismissed") ||
      errorMsg.includes("user did not share")
    ) {
      return;
    }

    if (errorMsg.includes("not installed") || errorMsg.includes("not found")) {
      const names: Record<SharePlatform, string> = {
        facebook: "Facebook",
        whatsapp: "WhatsApp",
        instagram: "Instagram",
        snapchat: "Snapchat",
        more: "Share",
      };
      Alert.alert("App Not Available", `${names[platform]} is not installed`);
      onError?.("App not installed");
      return;
    }

    Alert.alert("Share Failed", "Unable to share the image. Please try again.");
    onError?.(error.message || "Share failed");
  } finally {
    setTimeout(() => {
      shareInProgress = false;
    }, 1000);
  }
};
