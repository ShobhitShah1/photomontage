import { FontFamily } from "@/constants/fonts";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import Svg, { Path, Rect } from "react-native-svg";
import type { SelectionSource } from "../../store/selection-store";
import { colors, spacing } from "../../utiles/tokens";

interface ImagePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onPicked: (
    assets: ImagePicker.ImagePickerAsset[],
    source: SelectionSource
  ) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const LibraryIcon = () => (
  <Svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke={colors.text}
  >
    <Path
      d="M13 21H3.6C3.26863 21 3 20.7314 3 20.4V3.6C3 3.26863 3.26863 3 3.6 3H13"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M21 15.6V8.4C21 8.06863 20.7314 7.8 20.4 7.8H13"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M17.8021 12H13V21H17.8021C19.5681 21 21 19.5681 21 17.8021V15.6C21 13.6118 19.5882 12 17.8021 12Z"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CameraIcon = () => (
  <Svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke={colors.text}
  >
    <Path
      d="M21 8.5C21.8284 8.5 22.5 9.17157 22.5 10V18C22.5 18.8284 21.8284 19.5 21 19.5H3C2.17157 19.5 1.5 18.8284 1.5 18V10C1.5 9.17157 2.17157 8.5 3 8.5H6.55163C7.14917 8.5 7.71261 8.21389 8.09015 7.72863L9.40985 6.07137C9.78739 5.58611 10.3508 5.3 10.9484 5.3H13.0516C13.6492 5.3 14.2126 5.58611 14.5901 6.07137L15.9099 7.72863C16.2874 8.21389 16.8508 8.5 17.4484 8.5H21Z"
      strokeWidth="1.5"
    />
    <Rect
      x="9"
      y="12"
      width="6"
      height="4"
      rx="2"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ImagePickerModal: React.FC<ImagePickerModalProps> = ({
  visible,
  onClose,
  onPicked,
}) => {
  const [busy, setBusy] = useState(false);

  const handleHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const request = async (permissionRequest: () => Promise<any>) => {
    const { granted } = await permissionRequest();
    if (!granted) return false;
    return true;
  };

  const pickFromLibrary = async () => {
    handleHaptic();
    setBusy(true);
    try {
      const granted = await request(
        ImagePicker.requestMediaLibraryPermissionsAsync
      );
      if (!granted) {
        setBusy(false);
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        mediaTypes: "images",
        quality: 1,
      });

      if (!res.canceled) {
        onPicked(res.assets, "library");
        onClose();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const openCamera = async () => {
    handleHaptic();
    setBusy(true);
    try {
      const granted = await request(ImagePicker.requestCameraPermissionsAsync);
      if (!granted) {
        setBusy(false);
        return;
      }

      const res = await ImagePicker.launchCameraAsync({ quality: 1 });

      if (!res.canceled) {
        onPicked(res.assets, "camera");
        onClose();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const handleClose = () => {
    if (!busy) {
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      statusBarTranslucent
      animationType="slide"
      onRequestClose={handleClose}
      backdropColor={"rgba(0,0,0,0.5)"}
    >
      <View style={styles.backdrop}>
        <Animated.View style={styles.sheetContainer}>
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>Upload Media</Text>
              <Text style={styles.subtitle}>
                Choose how you want to add photos
              </Text>
            </View>

            <View style={styles.optionsContainer}>
              <ActionTile
                icon={<LibraryIcon />}
                title="Gallery"
                onPress={pickFromLibrary}
                disabled={busy}
              />
              <ActionTile
                icon={<CameraIcon />}
                title="Camera"
                onPress={openCamera}
                disabled={busy}
                delay={100}
              />
            </View>
          </View>

          <Pressable
            style={styles.closeButton}
            onPress={handleClose}
            disabled={busy}
          >
            <Text style={styles.closeButtonText}>Cancel</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
};

interface ActionTileProps {
  icon: React.ReactNode;
  title: string;
  onPress: () => void;
  disabled: boolean;
  delay?: number;
}

const ActionTile: React.FC<ActionTileProps> = ({
  icon,
  title,
  onPress,
  disabled,
}) => {
  const scale = useSharedValue(1);

  const rStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <AnimatedPressable
      style={[styles.tile, rStyle, disabled && styles.tileDisabled]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      {icon}
      <Text style={styles.tileText}>{title}</Text>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdropPressable: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheetContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    gap: 5,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.lg,
    overflow: "hidden",
    borderCurve: "continuous",
  },
  header: {
    marginBottom: spacing.lg,
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    fontFamily: FontFamily.medium,
    textAlign: "center",
  },
  optionsContainer: {
    flexDirection: "row",
    gap: spacing.md,
  },
  tile: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  tileDisabled: {
    opacity: 0.5,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  tileText: {
    fontSize: 15,
    fontFamily: FontFamily.semibold,
    color: colors.text,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  closeButton: {
    backgroundColor: colors.surface,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  closeButtonText: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: colors.text,
  },
});
