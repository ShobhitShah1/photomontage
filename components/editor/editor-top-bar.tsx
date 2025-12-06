import {
  ic_check,
  ic_download,
  ic_redo,
  ic_shuffle,
  ic_undo,
} from "@/assets/icons";
import { FontFamily } from "@/constants/fonts";
import { useTheme } from "@/context/theme-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { FC, memo, useCallback } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Pressable } from "../themed";

// Types
type AspectKey = "free" | "1:1" | "3:2" | "4:3" | "16:9";

interface EditorTopBarProps {
  isEditing: boolean;
  hasSelectedLayer?: boolean;
  onRedo: () => void;
  onUndo: () => void;
  onDownload: () => void;
  onShuffle: () => void;
  onComplateEditing: () => void;
  onResizeImage: (aspectRatio: AspectKey) => void;
  selectedAspect: AspectKey;
  onBringToFront?: () => void;
  onSendToBack?: () => void;
  editingActions?: {
    clearPath: () => void;
    toggleEditMode: () => void;
    applyCrop: () => void;
    canApply: boolean;
    hasPath: boolean;
    isEditMode: boolean;
  };
}

// Constants
const aspectOptions: { key: AspectKey; label: string }[] = [
  { key: "free", label: "✂" },
  { key: "1:1", label: "1:1" },
  { key: "3:2", label: "3:2" },
  { key: "4:3", label: "4:3" },
  { key: "16:9", label: "16:9" },
];

// Memoized IconButton component
interface IconButtonProps {
  icon?: number;
  content?: React.ReactNode;
  onPress?: () => void;
  size?: number;
  rounded?: number;
  backgroundColor: string;
  iconTintColor: string;
}

const IconButton = memo<IconButtonProps>(
  ({
    icon,
    content,
    onPress,
    size = 45,
    rounded = 12,
    backgroundColor,
    iconTintColor,
  }) => (
    <Pressable
      style={[
        styles.buttonStyle,
        {
          width: size,
          height: size,
          borderRadius: rounded,
          backgroundColor,
        },
      ]}
      onPress={onPress}
    >
      {content ? (
        content
      ) : icon ? (
        <Image
          source={icon}
          style={styles.buttonIcon}
          tintColor={iconTintColor}
          contentFit="contain"
        />
      ) : null}
    </Pressable>
  )
);

// Memoized AspectButton component
interface AspectButtonProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  textColor: string;
}

const AspectButton = memo<AspectButtonProps>(
  ({ label, selected, onPress, textColor }) => (
    <Pressable
      onPress={onPress}
      style={[
        styles.aspectButton,
        { backgroundColor: "rgba(255, 255, 255, 0.06)" },
        selected && styles.aspectButtonSelected,
      ]}
    >
      <Text style={[styles.aspectLabel, { color: textColor }]}>{label}</Text>
    </Pressable>
  )
);

// Main component
const EditorTopBar: FC<EditorTopBarProps> = ({
  isEditing,
  hasSelectedLayer,
  onComplateEditing,
  onDownload,
  onRedo,
  onResizeImage,
  onUndo,
  editingActions,
  onShuffle,
  selectedAspect,
  onBringToFront,
  onSendToBack,
}) => {
  const { theme } = useTheme();

  const handleSelectAspect = useCallback(
    (key: AspectKey) => {
      onResizeImage(key);
    },
    [onResizeImage]
  );

  // Render editing view (aspect ratio selection)
  if (isEditing) {
    return (
      <View style={styles.container}>
        <View style={styles.editLeftGroup}>
          {aspectOptions.map((option) => (
            <AspectButton
              key={option.key}
              label={option.label}
              selected={selectedAspect === option.key}
              onPress={() => handleSelectAspect(option.key)}
              textColor={theme.buttonIcon}
            />
          ))}
        </View>

        <View style={styles.editRightGroup}>
          <IconButton
            icon={ic_check}
            onPress={
              editingActions?.canApply ? editingActions.applyCrop : undefined
            }
            backgroundColor={theme.buttonBackground}
            iconTintColor={theme.buttonIcon}
          />
        </View>
      </View>
    );
  }

  // Render preview view (undo, redo, shuffle, download)
  return (
    <View style={styles.container}>
      <View style={styles.leftGroup}>
        <IconButton
          icon={ic_undo}
          onPress={onUndo}
          backgroundColor={theme.buttonBackground}
          iconTintColor={theme.buttonIcon}
        />
        <IconButton
          icon={ic_redo}
          onPress={onRedo}
          backgroundColor={theme.buttonBackground}
          iconTintColor={theme.buttonIcon}
        />
        <IconButton
          icon={ic_shuffle}
          onPress={onShuffle}
          backgroundColor={theme.buttonBackground}
          iconTintColor={theme.buttonIcon}
        />
        {hasSelectedLayer && (
          <>
            <IconButton
              content={
                <MaterialCommunityIcons
                  name="arrange-bring-forward"
                  size={20}
                  color={theme.buttonIcon}
                />
              }
              onPress={onBringToFront}
              backgroundColor={theme.buttonBackground}
              iconTintColor={theme.buttonIcon}
            />
            <IconButton
              content={
                <MaterialCommunityIcons
                  name="arrange-send-backward"
                  size={20}
                  color={theme.buttonIcon}
                />
              }
              onPress={onSendToBack}
              backgroundColor={theme.buttonBackground}
              iconTintColor={theme.buttonIcon}
            />
          </>
        )}
      </View>

      <View style={styles.rightGroup}>
        <IconButton
          icon={ic_download}
          onPress={onDownload}
          backgroundColor={theme.buttonBackground}
          iconTintColor={theme.buttonIcon}
        />
      </View>
    </View>
  );
};

export default memo(EditorTopBar);

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
  },
  buttonStyle: {
    alignItems: "center",
    justifyContent: "center",
  },
  buttonIcon: {
    width: "45%",
    height: "45%",
  },
  leftGroup: {
    flexDirection: "row",
    gap: 12,
  },
  rightGroup: {
    flexDirection: "row",
  },
  editLeftGroup: {
    gap: 10,
    height: 45,
    flexShrink: 1,
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(45, 45, 45, 0.3)",
  },
  editRightGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  aspectButton: {
    minWidth: 44,
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  aspectButtonSelected: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  aspectLabel: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
  },
});
