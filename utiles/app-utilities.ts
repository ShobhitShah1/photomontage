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
  const appId = "your-app-id"; // Replace with your actual App Store ID
  const playStoreId = "com.yourcompany.gigglam"; // Replace with your actual Play Store package name

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
      "Unable to open the app store. Please search for Gigglam in your app store."
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
        ? "https://apps.apple.com/app/gigglam/id1234567890"
        : "https://play.google.com/store/apps/details?id=com.gigglam";

    const message = `Check out Gigglam! 🎉\n\nCreate rooms, share images, and have fun with friends!\n\nDownload it here: ${appUrl}`;

    const shareOptions = {
      title: "Share Gigglam with Friends",
      message: message,
      url: appUrl,
      subject: "Check out Gigglam!",
    };

    try {
      await Share.open(shareOptions);
    } catch (shareError: any) {}
  } catch (error) {
    console.error("Error sharing app:", error);

    Alert.alert(
      "Share Gigglam",
      "Check out Gigglam! 🎉\n\nCreate rooms, share images, and have fun with friends!",
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
    name: "Gigglam",
    version,
    buildNumber,
    description: "Create rooms, share images, and have fun with friends!",
  };
};
