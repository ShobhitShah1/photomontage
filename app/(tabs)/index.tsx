import { StoryRow } from "@/components/story-row";
import { SafeAreaView } from "@/components/themed";
import * as MediaLibrary from "expo-media-library";
import { useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";

export default function Tab() {
  useEffect(() => {
    async () => {
      await MediaLibrary.requestPermissionsAsync();
    };
  }, []);

  const contestStoryData = useMemo(() => {
    return Array.from({ length: 10 }, (_, x) => {
      return {
        id: x.toString(),
        title: "cdcd",
        like_count: 0,
        username: "dcd",
        profile_image: `https://picsum.photos/id/${x}/200/300`,
        image: `https://picsum.photos/id/${x * 2}/200/300`,
      };
    });
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {contestStoryData.length > 0 && (
          <View style={styles.storiesSection}>
            <StoryRow
              stories={contestStoryData}
              contestStoryData={contestStoryData}
            />
          </View>
        )}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  storiesSection: {
    // marginTop: 10,
  },
});
