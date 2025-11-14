import { ic_upload } from "@/assets/icons";
import { useTheme } from "@/context/theme-context";
import { PickedImage } from "@/store/selection-store";
import { Image } from "expo-image";
import React, { FC, memo } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { Pressable } from "../themed";

interface EditorBottomBarInterface {
  onUploadPress: () => void;
  images: PickedImage[];
}

const EditorBottomBar: FC<EditorBottomBarInterface> = ({ images }) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <Pressable
        style={[
          styles.uploadButton,
          { backgroundColor: theme.buttonBackground },
        ]}
      >
        <Image
          source={ic_upload}
          style={styles.uploadIcon}
          tintColor={theme.buttonIcon}
          contentFit="contain"
        />
      </Pressable>

      <FlatList
        data={images}
        horizontal
        style={styles.flatListStyle}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.columnWrapperStyle}
        renderItem={({ index, item }) => {
          return (
            <Pressable key={index} style={styles.uploadButton}>
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
    justifyContent: "space-between",
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
  flatListStyle: {},
});
