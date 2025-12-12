import {
  refrance_1,
  refrance_2,
  refrance_3,
  refrance_4,
  refrance_5,
  refrance_6,
  refrance_7,
  refrance_8,
} from "@/assets/images";
import { HorizontalGallery } from "@/components/horizontal-gallery";
import { StoryRow } from "@/components/story-row";
import { SafeAreaView } from "@/components/themed";
import * as MediaLibrary from "expo-media-library";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";

const AUTO_ROTATE_INTERVAL = 10000; // 10 seconds

export default function Tab() {
  const [galleryIndex, setGalleryIndex] = useState(0);

  useEffect(() => {
    async () => {
      await MediaLibrary.requestPermissionsAsync();
    };
  }, []);

  const contestStoryData = useMemo(() => {
    return [
      { id: "1", image: refrance_1 },
      { id: "2", image: refrance_2 },
      { id: "3", image: refrance_3 },
      { id: "4", image: refrance_4 },
      { id: "5", image: refrance_5 },
      { id: "6", image: refrance_6 },
      { id: "7", image: refrance_7 },
      { id: "8", image: refrance_8 },
    ];
  }, []);

  const galleryImages = useMemo(() => contestStoryData, [contestStoryData]);

  useEffect(() => {
    if (galleryImages.length === 0) return;

    const intervalId = setInterval(() => {
      setGalleryIndex((prevIndex) => (prevIndex + 1) % galleryImages.length);
    }, AUTO_ROTATE_INTERVAL);

    return () => clearInterval(intervalId);
  }, [galleryImages.length]);

  const onStoryPress = (index: number) => {
    setGalleryIndex(index);
  };

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
              onStoryPress={onStoryPress}
            />
          </View>
        )}

        {galleryImages?.length > 0 && (
          <View style={styles.gallerySection}>
            <HorizontalGallery
              images={galleryImages}
              activeIndex={galleryIndex}
              onImagePress={() => {}}
              onLikePress={() => {}}
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
  },
  storiesSection: {
    // marginTop: 10,
  },
  gallerySection: {
    marginVertical: 0,
  },
});
