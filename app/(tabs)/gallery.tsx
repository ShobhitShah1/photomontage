import { StyleSheet, Text, View } from "react-native";

export default function GalleryScreen() {
  return (
    <View style={styles.container}>
      <Text>Tab Gallerys</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
