import { PermissionItem } from "@/components/permissions/permission-item";
import { usePermissions } from "@/context/permission-context";
import { useTheme } from "@/context/theme-context";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function PermissionsScreen() {
  const { theme } = useTheme();
  const {
    requestPermissions,
    requestCameraPermission,
    requestLibraryPermission,
    cameraGranted,
    libraryGranted,
  } = usePermissions();
  const router = useRouter();
  const [isRequesting, setIsRequesting] = useState(false);

  const handleGrantPermissions = async () => {
    setIsRequesting(true);
    try {
      const result = await requestPermissions();
      if (result) {
        router.replace("/(tabs)");
      } else {
        if (Platform.OS === "ios") {
          Linking.openURL("app-settings:");
        } else {
          Linking.openSettings();
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleCameraRequest = async () => {
    if (cameraGranted) return;
    try {
      await requestCameraPermission();
    } catch (error) {
      console.error(error);
    }
  };

  const handleLibraryRequest = async () => {
    if (libraryGranted) return;
    try {
      await requestLibraryPermission();
    } catch (error) {
      console.error(error);
    }
  };

  const handleNotNow = () => {
    router.replace("/(tabs)");
  };

  const openSettings = () => {
    if (Platform.OS === "ios") {
      Linking.openURL("app-settings:");
    } else {
      Linking.openSettings();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.contentContainer}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: "rgba(248, 217, 57, 0.1)" },
          ]}
        >
          <Ionicons name="shield-checkmark" size={64} color={theme.primary} />
        </View>

        <Text style={[styles.title, { color: theme.textPrimary }]}>
          Let's Get Started
        </Text>

        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Photomontage needs access to your camera and photos to help you create
          and save amazing stories.
        </Text>

        <View style={styles.permissionsList}>
          <PermissionItem
            icon="camera"
            title="Camera Access"
            description="Required to snap photos and add them directly to your montages."
            isGranted={cameraGranted}
            theme={theme}
            onPress={handleCameraRequest}
          />
          <PermissionItem
            icon="images"
            title="Photo Library"
            description="Required to select existing photos and save your finished artwork."
            isGranted={libraryGranted}
            theme={theme}
            onPress={handleLibraryRequest}
          />
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.primary }]}
            onPress={handleGrantPermissions}
            activeOpacity={0.8}
            disabled={isRequesting}
          >
            {isRequesting ? (
              <ActivityIndicator color="black" />
            ) : (
              <Text style={styles.buttonText}>
                {cameraGranted && libraryGranted ? "Continue" : "Allow Access"}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.secondaryActions}>
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: theme.primary }]}
              onPress={handleNotNow}
            >
              <Text
                style={[
                  styles.secondaryButtonText,
                  { color: theme.textPrimary },
                ]}
              >
                Not Now
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: theme.primary }]}
              onPress={openSettings}
            >
              <Text
                style={[
                  styles.secondaryButtonText,
                  { color: theme.textPrimary },
                ]}
              >
                Settings
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 24,
  },
  permissionsList: {
    width: "100%",
    marginBottom: 20,
    gap: 0,
  },
  footer: {
    width: "100%",
    marginTop: "auto",
    marginBottom: 40,
    gap: 16,
  },
  button: {
    width: "100%",
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonText: {
    color: "#000000",
    fontSize: 18,
    fontWeight: "bold",
  },
  secondaryActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  secondaryButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    borderWidth: 1.5,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
