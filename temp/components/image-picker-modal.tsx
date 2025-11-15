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
import { colors, radii, spacing } from "../../utiles/tokens";

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
    if (!granted) return false;
    return true;
  };

  const pickFromLibrary = async () => {
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
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <View style={styles.bottomContainer}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.handle} />

            <View style={styles.header}>
              <Text style={styles.title}>Add image</Text>
              <Text style={styles.subtitle}>
                Drop in a photo from your library or capture a new one.
              </Text>
            </View>

            <View style={styles.tileRow}>
              <ActionTile
                icon={<LibraryIcon />}
                title="Photo library"
                description="Pick one or multiple images."
                onPress={pickFromLibrary}
                disabled={busy}
              />
              <ActionTile
                icon={<CameraIcon />}
                title="Use camera"
                description="Take a quick photo."
                onPress={openCamera}
                disabled={busy}
              />
            </View>

            {busy && (
              <View style={styles.loadingOverlay} pointerEvents="none">
                <ActivityIndicator color={colors.text} size="small" />
              </View>
            )}
          </Pressable>

          <Pressable
            style={styles.cancelButton}
            onPress={handleClose}
            disabled={busy}
          >
            <Text style={styles.cancelText}>Close</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
};

interface ActionTileProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onPress: () => void;
  disabled: boolean;
}

const ActionTile: React.FC<ActionTileProps> = ({
  icon,
  title,
  description,
  onPress,
  disabled,
}) => {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.tile,
        pressed && !disabled && styles.tilePressed,
        disabled && styles.tileDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.tileIconContainer}>{icon}</View>
      <View style={styles.tileTextContainer}>
        <Text style={styles.tileTitle}>{title}</Text>
        <Text style={styles.tileDescription}>{description}</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  bottomContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    overflow: "hidden",
    shadowColor: "rgba(0,0,0,0.9)",
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  handle: {
    alignSelf: "center",
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.22)",
    marginBottom: spacing.md,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
  },
  tileRow: {
    flexDirection: "row",
    marginTop: spacing.sm,
    gap: 10,
  },
  tile: {
    flex: 1,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    flexDirection: "row",
    alignItems: "center",
  },
  tilePressed: {
    backgroundColor: colors.overlay,
  },
  tileDisabled: {
    opacity: 0.5,
  },
  tileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    marginRight: spacing.md,
  },
  tileTextContainer: {
    flex: 1,
  },
  tileTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  tileDescription: {
    color: colors.textMuted,
    fontSize: 12,
  },
  cancelButton: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "rgba(0,0,0,0.8)",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  cancelText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
});
