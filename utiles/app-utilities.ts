import * as StoreReview from "expo-store-review";
import { Alert, Linking, Platform } from "react-native";
import Share from "react-native-share";

/**
 * Opens the app store for rating and review
 */
export const openAppForRating = async () => {
  try {
    // Check if StoreReview is available
    const isAvailable = await StoreReview.isAvailableAsync();

    if (isAvailable) {
      // Use the native in-app review (iOS 10.3+, Android 5.0+)
      await StoreReview.requestReview();
    } else {
      // Fallback to opening the store directly
      await openAppStore();
    }
  } catch (error) {
    console.error("Error opening app for rating:", error);
    // Fallback to opening the store
    await openAppStore();
  }
};

/**
 * Opens the app store directly (fallback method)
 */
const openAppStore = async () => {
  const appId = "6741764663";
  const playStoreId = "com.photomontage";

  try {
    if (Platform.OS === "ios") {
      // iOS App Store
      const appStoreUrl = `https://apps.apple.com/app/id${appId}`;
      const supported = await Linking.canOpenURL(appStoreUrl);

      if (supported) {
        await Linking.openURL(appStoreUrl);
      } else {
        throw new Error("Cannot open App Store");
      }
    } else {
      // Android Play Store
      const playStoreUrl = `https://play.google.com/store/apps/details?id=${playStoreId}`;
      const marketUrl = `market://details?id=${playStoreId}`;

      // Try to open the Play Store app first
      const canOpenMarket = await Linking.canOpenURL(marketUrl);

      if (canOpenMarket) {
        await Linking.openURL(marketUrl);
      } else {
        // Fallback to web browser
        await Linking.openURL(playStoreUrl);
      }
    }
  } catch (error) {
    console.error("Error opening app store:", error);
    Alert.alert(
      "Error",
      "Unable to open the app store. Please search for Photomontage in your app store."
    );
  }
};

/**
 * Shares the app with friends
 */
export const shareAppWithFriends = async () => {
  try {
    const appUrl =
      Platform.OS === "ios"
        ? "https://apps.apple.com/app/photomontage/id6741764663"
        : "https://play.google.com/store/apps/details?id=com.photomontage";

    const message = `Check out Photomontage! 📸\n\nI found this amazing app for editing photos and making collages. It's super easy to use and you don't even need an account! \n\nDownload it here: ${appUrl}`;

    const shareOptions = {
      title: "Share Photomontage",
      message: message,
      url: appUrl,
      subject: "Have you seen Photomontage?",
    };

    try {
      await Share.open(shareOptions);
    } catch (shareError: any) {}
  } catch (error) {
    console.error("Error sharing app:", error);

    Alert.alert(
      "Share Photomontage",
      `Check out Photomontage! \n\nI found this amazing app for editing photos and making collages. It's super easy to use and you don't even need an account!`,
      [
        { text: "OK", style: "default" },
        { text: "Cancel", style: "cancel" },
      ]
    );
  }
};

/**
 * Opens external links safely
 */
export const openExternalLink = async (url: string) => {
  try {
    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Error", "Unable to open the link");
    }
  } catch (error) {
    console.error("Error opening external link:", error);
    Alert.alert("Error", "Unable to open the link");
  }
};

/**
 * Gets app version information
 */
export const getAppVersion = () => {
  // This would typically come from your app.json or package.json
  return {
    version: "1.0.0",
    buildNumber: "1",
  };
};

/**
 * Formats app info for sharing or display
 */
export const getAppInfo = () => {
  const { version, buildNumber } = getAppVersion();
  return {
    name: "Photomontage",
    version,
    buildNumber,
    description: "The easiest way to edit photos and create stunning collages!",
  };
};
