import { ic_download, ic_redo, ic_undo } from "@/assets/icons";
import { useTheme } from "@/context/theme-context";
import { Image } from "expo-image";
import React, { FC, memo } from "react";
import { StyleSheet, View } from "react-native";
import { Pressable } from "../themed";

interface EditorTopBarInterface {
  isEditing: boolean;
  onRedo: () => void;
  onUndo: () => void;
  onDownload: () => void;
  onComplateEditing: () => void;
  onResizeImage: () => void;
}

const EditorTopBar: FC<EditorTopBarInterface> = ({
  isEditing,
  onComplateEditing,
  onDownload,
  onRedo,
  onResizeImage,
  onUndo,
}) => {
  const { theme } = useTheme();

  const Button = ({
    icon,
    onPress,
  }: {
    icon: number;
    onPress: () => void | null | undefined;
  }) => {
    return (
      <Pressable
        style={[
          styles.buttonStyle,
          { backgroundColor: theme.buttonBackground },
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
  };

  const PreviewView = () => {
    return (
      <>
        <View style={styles.redoUndoContainer}>
          <Button icon={ic_undo} onPress={onRedo} />
          <Button icon={ic_redo} onPress={onUndo} />
          <Button icon={ic_redo} onPress={() => {}} />
        </View>

        <View>
          <Button icon={ic_download} onPress={onDownload} />
        </View>
      </>
    );
  };

  const EditingView = () => {
    return (
      <>
        <View style={styles.redoUndoContainer}>
          <Button icon={ic_undo} onPress={onRedo} />
          <Button icon={ic_redo} onPress={onUndo} />
          <Button icon={ic_redo} onPress={() => {}} />
        </View>

        <View>
          <Button icon={ic_download} onPress={onDownload} />
        </View>
      </>
    );
  };

  return (
    <View style={styles.container}>
      {!isEditing ? <PreviewView /> : <EditingView />}
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
  },
  buttonStyle: {
    width: 45,
    height: 45,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonIcon: {
    width: "45%",
    height: "45%",
  },
  redoUndoContainer: {
    flexDirection: "row",
    gap: 15,
  },
});
