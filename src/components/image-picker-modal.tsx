import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import type { SelectionSource } from "../../store/selection-store";
import { colors, radii, spacing } from "../theme/tokens";

interface ImagePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onPicked: (
    assets: ImagePicker.ImagePickerAsset[],
    source: SelectionSource
  ) => void;
}

const LibraryIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff">
    <Path
      d="M13 21H3.6C3.26863 21 3 20.7314 3 20.4V3.6C3 3.26863 3.26863 3 3.6 3H13"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M21 15.6V8.4C21 8.06863 20.7314 7.8 20.4 7.8H13"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M17.8021 12H13V21H17.8021C19.5681 21 21 19.5681 21 17.8021V15.6C21 13.6118 19.5882 12 17.8021 12Z"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CameraIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff">
    <Path
      d="M21 8.5C21.8284 8.5 22.5 9.17157 22.5 10V18C22.5 18.8284 21.8284 19.5 21 19.5H3C2.17157 19.5 1.5 18.8284 1.5 18V10C1.5 9.17157 2.17157 8.5 3 8.5H6.55163C7.14917 8.5 7.71261 8.21389 8.09015 7.72863L9.40985 6.07137C9.78739 5.58611 10.3508 5.3 10.9484 5.3H13.0516C13.6492 5.3 14.2126 5.58611 14.5901 6.07137L15.9099 7.72863C16.2874 8.21389 16.8508 8.5 17.4484 8.5H21Z"
      strokeWidth="2"
    />
    <Rect
      x="9"
      y="12"
      width="6"
      height="4"
      rx="2"
      strokeWidth="2"
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

  const request = async (permissionRequest: () => Promise<any>) => {
    const { granted } = await permissionRequest();
    if (!granted) {
      // You could show an alert here if you wanted
      return false;
    }
    return true;
  };

  const pick = async () => {
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
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

  const camera = async () => {
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <View style={styles.modalContainer}>
          <Pressable style={styles.card}>
            <Text style={styles.title}>Add Image</Text>
            <Text style={styles.subtitle}>
              Choose from your library or take a new photo.
            </Text>

            <View style={styles.buttonContainer}>
              <OptionButton
                icon={<LibraryIcon />}
                label="Choose from Library"
                onPress={pick}
                disabled={busy}
              />
              <View style={styles.divider} />
              <OptionButton
                icon={<CameraIcon />}
                label="Use Camera"
                onPress={camera}
                disabled={busy}
              />
            </View>

            {busy && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator color={colors.text} size="small" />
              </View>
            )}
          </Pressable>

          <Pressable
            style={[styles.card, styles.cancelCard]}
            onPress={handleClose}
            disabled={busy}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
};

interface OptionButtonProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  disabled: boolean;
}

const OptionButton: React.FC<OptionButtonProps> = ({
  icon,
  label,
  onPress,
  disabled,
}) => (
  <Pressable
    style={({ pressed }) => [
      styles.optionButton,
      pressed && !disabled && { backgroundColor: colors.overlay },
      disabled && { opacity: 0.5 },
    ]}
    onPress={onPress}
    disabled={disabled}
  >
    {icon}
    <Text style={styles.optionText}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    margin: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    overflow: "hidden",
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
  },
  cancelCard: {
    borderColor: "#fff",
    borderWidth: 1,
    paddingVertical: 3,
    borderRadius: radii.lg,
    boxShadow: "0px 0px 10px 0.5px rgba(255,255,255,0.5)",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
    paddingTop: spacing.lg,
    paddingBottom: 5,
    paddingHorizontal: spacing.lg,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  buttonContainer: {
    backgroundColor: "rgba(0,0,0,0.03)",
    marginBottom: 10,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  optionText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "500",
    marginLeft: spacing.md,
  },
  cancelText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    padding: spacing.lg,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
});
