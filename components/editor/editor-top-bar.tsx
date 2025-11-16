import { ic_download, ic_redo, ic_shuffle, ic_undo } from "@/assets/icons";
import { useTheme } from "@/context/theme-context";
import { Image } from "expo-image";
import React, { FC, memo, useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Pressable } from "../themed";

interface EditorTopBarInterface {
  isEditing: boolean;
  onRedo: () => void;
  onUndo: () => void;
  onDownload: () => void;
  onShuffle: () => void;
  onComplateEditing: () => void;
  onResizeImage: (aspectRatio: AspectKey) => void;
  editingActions?: {
    clearPath: () => void;
    toggleEditMode: () => void;
    applyCrop: () => void;
    canApply: boolean;
    hasPath: boolean;
    isEditMode: boolean;
  };
}

type AspectKey = "free" | "1:1" | "3:2" | "4:3" | "16:9";

const aspectOptions: { key: AspectKey; label: string }[] = [
  { key: "free", label: "✂" },
  { key: "1:1", label: "1:1" },
  { key: "3:2", label: "3:2" },
  { key: "4:3", label: "4:3" },
  { key: "16:9", label: "16:9" },
];

const EditorTopBar: FC<EditorTopBarInterface> = ({
  isEditing,
  onComplateEditing,
  onDownload,
  onRedo,
  onResizeImage,
  onUndo,
  editingActions,
  onShuffle,
}) => {
  const { theme } = useTheme();
  const [selectedAspect, setSelectedAspect] = useState<AspectKey>("free");

  const handleSelectAspect = useCallback(
    (key: AspectKey) => {
      setSelectedAspect(key);
      onResizeImage(key);
    },
    [onResizeImage]
  );

  const IconButton = ({
    icon,
    onPress,
    size = 45,
    rounded = 12,
  }: {
    icon: number;
    onPress: () => void;
    size?: number;
    rounded?: number;
  }) => (
    <Pressable
      style={[
        styles.buttonStyle,
        {
          width: size,
          height: size,
          borderRadius: rounded,
          backgroundColor: theme.buttonBackground,
        },
      ]}
      onPress={onPress}
    >
      <Image
        source={icon}
        style={styles.buttonIcon}
        tintColor={theme.buttonIcon}
        contentFit="contain"
      />
    </Pressable>
  );

  const AspectButton = ({
    label,
    selected,
    onPress,
  }: {
    label: string;
    selected: boolean;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      style={[
        styles.aspectButton,
        { backgroundColor: theme.buttonBackground },
        selected && styles.aspectButtonSelected,
      ]}
    >
      <Text style={[styles.aspectLabel, { color: theme.buttonIcon }]}>
        {label}
      </Text>
    </Pressable>
  );

  const PreviewView = () => (
    <>
      <View style={styles.leftGroup}>
        <IconButton icon={ic_undo} onPress={onUndo} />
        <IconButton icon={ic_redo} onPress={onRedo} />
        <IconButton icon={ic_shuffle} onPress={onShuffle} />
      </View>

      <View style={styles.rightGroup}>
        <IconButton icon={ic_download} onPress={onDownload} />
      </View>
    </>
  );

  const EditingView = () => (
    <>
      <View style={styles.editLeftGroup}>
        {aspectOptions.map((option) => (
          <AspectButton
            key={option.key}
            label={option.label}
            selected={selectedAspect === option.key}
            onPress={() => handleSelectAspect(option.key)}
          />
        ))}
      </View>

      <View style={styles.editRightGroup}>
        <Pressable
          style={[
            styles.confirmButton,
            {
              backgroundColor: theme.buttonBackground,
              opacity: editingActions?.canApply ? 1 : 0.5,
            },
          ]}
          onPress={
            editingActions?.canApply ? editingActions.applyCrop : undefined
          }
          disabled={!editingActions?.canApply}
        >
          <Text style={[styles.confirmLabel, { color: theme.buttonIcon }]}>
            ✓
          </Text>
        </Pressable>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      {isEditing ? <EditingView /> : <PreviewView />}
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
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
    backgroundColor: "rgba(45, 45, 45, 0.3)",
  },
  editRightGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  aspectButton: {
    minWidth: 40,
    paddingHorizontal: 10,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.7,
  },
  aspectButtonSelected: {
    opacity: 1,
  },
  aspectLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  confirmButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmLabel: {
    fontSize: 18,
    fontWeight: "700",
  },
  actionButton: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
