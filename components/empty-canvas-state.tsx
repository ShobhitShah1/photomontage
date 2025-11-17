import { FontFamily } from "@/constants/fonts";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export const EmptyCanvasState: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.mainText}>Trim it, twist it, make it fun!</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 10,
  },
  mainText: {
    fontSize: 24,
    fontFamily: FontFamily.medium,
    color: "rgba(141, 141, 141, 1)",
    textAlign: "center",
    marginBottom: 3,
  },
});

export default EmptyCanvasState;
