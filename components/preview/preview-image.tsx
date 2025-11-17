import { Image } from "expo-image";
import React, { FC, memo } from "react";
import { StyleSheet, View } from "react-native";

interface PreviewImageProps {
  uri: string;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  x: number;
  y: number;
}

export const PreviewImage: FC<PreviewImageProps> = memo(
  ({ uri, width, height, rotation, zIndex, x, y }) => {
    return (
      <View
        style={[
          styles.container,
          {
            left: x,
            top: y,
            width,
            height,
            transform: [{ rotate: `${rotation}deg` }],
            zIndex,
          },
        ]}
      >
        <View style={styles.border}>
          <Image source={{ uri }} style={styles.image} contentFit="cover" />
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    position: "absolute",
  },
  border: {
    width: "100%",
    height: "100%",
    // borderWidth: 2,
    // borderColor: "#FFFFFF",
    borderRadius: 2,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
