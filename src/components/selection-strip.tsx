import { Image } from "expo-image";
import React, { memo, useCallback } from "react";
import type { ListRenderItem } from "react-native";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import type { PickedImage } from "../../store/selection-store";
import { colors, radii, spacing } from "../theme/tokens";

interface SelectionStripProps {
  images: PickedImage[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

interface ThumbnailProps {
  item: PickedImage;
  active: boolean;
  onSelect: (id: string) => void;
}

const Thumbnail: React.FC<ThumbnailProps> = memo(
  ({ item, active, onSelect }) => {
    const handlePress = useCallback(() => {
      onSelect(item.id);
    }, [item.id, onSelect]);

    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.thumbnail,
          active && styles.thumbnailActive,
          pressed && styles.thumbnailPressed,
        ]}
      >
        <Image
          source={{ uri: item.thumbUri ?? item.uri }}
          style={styles.thumbnailImage}
          contentFit="cover"
        />
        {active && <View style={styles.activeRing} />}
      </Pressable>
    );
  }
);

export const SelectionStrip: React.FC<SelectionStripProps> = ({
  images,
  activeId,
  onSelect,
}) => {
  const renderItem = useCallback<ListRenderItem<PickedImage>>(
    ({ item }) => (
      <Thumbnail
        item={item}
        active={item.id === activeId}
        onSelect={onSelect}
      />
    ),
    [activeId, onSelect]
  );

  return (
    <FlatList
      data={images}
      horizontal
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.content}
      ItemSeparatorComponent={Separator}
      showsHorizontalScrollIndicator={false}
    />
  );
};

const Separator = () => <View style={styles.separator} />;

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.sm,
  },
  separator: {
    width: spacing.sm,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: radii.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  thumbnailPressed: {
    opacity: 0.8,
  },
  thumbnailActive: {
    borderColor: colors.primary,
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  activeRing: {
    position: "absolute",
    inset: 4,
    borderRadius: radii.md - 4,
    borderWidth: 2,
    borderColor: colors.primary,
  },
});
