import { ic_upload } from "@/assets/icons";
import { MiniCanvasPreview } from "@/components/canvas/mini-canvas-preview";
import { useTheme } from "@/context/theme-context";
import { PickedImage } from "@/store/selection-store";
import { Layer } from "@/store/store";
import { Image } from "expo-image";
import React, { FC, memo } from "react";
import { Alert, FlatList, StyleSheet, View } from "react-native";
import { Pressable } from "../themed";

interface EditorBottomBarInterface {
  onUploadPress: () => void;
  images: PickedImage[];
  selectedLayerId: string | null;
  onImageSelect: (image: PickedImage, index: number) => void;
  onImageDelete?: (image: PickedImage) => void;
  canvasLayers?: Layer[];
  canvasWidth?: number;
  canvasHeight?: number;
  onEditingPreviewPress?: () => void;
}

const EditorBottomBar: FC<EditorBottomBarInterface> = ({
  images,
  onImageSelect,
  onUploadPress,
  onImageDelete,
  selectedLayerId,
  canvasLayers = [],
  canvasWidth = 640,
  canvasHeight = 640,
  onEditingPreviewPress
  }) => {
  const { theme } = useTheme();

  const handleLongPress = (item: PickedImage) => {
    if (!onImageDelete) return;
    Alert.alert("Delete Image", "Are you sure you want to delete this image?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => onImageDelete(item),
      },
    ]);
  };

  const showCanvasPreview =
    canvasLayers.length > 0 && canvasWidth > 0 && canvasHeight > 0;

  const placedLayers = canvasLayers.filter(
    (layer) => layer.croppedUri && layer.maskPath
  );

  return (
    <View style={styles.container}>
      <Pressable
        style={[
          styles.uploadButton,
          { backgroundColor: theme.buttonBackground },
        ]}
        onPress={onUploadPress}
      >
        <Image
          source={ic_upload}
          style={styles.uploadIcon}
          tintColor={theme.buttonIcon}
          contentFit="contain"
        />
      </Pressable>

      {showCanvasPreview && placedLayers.length > 0 && (
        <Pressable
          onPress={onEditingPreviewPress}
          style={[
            styles.canvasPreviewButton,
            { backgroundColor: theme.buttonBackground },
          ]}
        >
          <MiniCanvasPreview
            layers={placedLayers}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            previewWidth={54}
            previewHeight={64}
            showBorder={false}
            borderColor="transparent"
          />
        </Pressable>
      )}

      <FlatList
        data={images}
        horizontal
        style={styles.flatListStyle}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.columnWrapperStyle}
        renderItem={({ index, item }) => {
          return (
            <Pressable
              key={index}
              style={[
                styles.uploadButton,
                {
                  borderWidth: 2,
                  borderColor:
                    selectedLayerId === item.id ? theme.primary : "transparent",
                },
              ]}
              onPress={() => onImageSelect(item, index)}
              onLongPress={() => handleLongPress(item)}
            >
              <Image
                contentFit="cover"
                source={{ uri: item.uri }}
                style={styles.imageStyle}
              />
            </Pressable>
          );
        }}
      />
    </View>
  );
};

export default memo(EditorBottomBar);

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: 5,
    paddingHorizontal: 10,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  canvasPreviewButton: {
    width: 58,
    height: 68,
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    padding: 2,
  },
  uploadButton: {
    width: 58,
    height: 68,
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadIcon: {
    width: 31,
    height: 20,
  },
  imageStyle: {
    width: "100%",
    height: "100%",
  },
  columnWrapperStyle: {
    gap: 5,
  },
  flatListStyle: {
    flexGrow: 0,
  },
});
