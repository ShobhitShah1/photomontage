import { Image } from "expo-image";
import React, { useEffect } from "react";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useTransformGesture } from "../hooks/use-transform-gesture";
import { Layer } from "../state/store";
import { colors } from "../theme/tokens";

interface CanvasImageProps {
  layer: Layer;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onChange: (l: Layer) => void;
  onRequestCrop?: (id: string) => void;
}

export const CanvasImage: React.FC<CanvasImageProps> = ({
  layer,
  isSelected,
  onSelect,
  onChange,
  onRequestCrop,
}) => {
  const { gesture, animatedStyle, sync } = useTransformGesture({
    x: layer.x,
    y: layer.y,
    scale: layer.scale,
    rotation: layer.rotation,
    onSelect: () => onSelect(layer.id),
    onChange: (n) => onChange({ ...layer, ...n }),
  });

  useEffect(() => {
    sync(layer.x, layer.y, layer.scale, layer.rotation);
  }, [layer.x, layer.y, layer.scale, layer.rotation]);

  const src = layer.croppedUri ?? layer.thumbUri ?? layer.originalUri;

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (onRequestCrop) {
        scheduleOnRN(onRequestCrop, layer.id);
      }
    });
  <Image source={{ uri: src }} style={{ width: 50, height: 50 }} />;

  const finalGesture = Gesture.Simultaneous(doubleTap, gesture);

  return (
    <GestureDetector gesture={finalGesture}>
      <Animated.View
        style={[
          {
            position: "absolute",
            width: layer.width,
            height: layer.height,
            zIndex: layer.z,
            opacity: 1,
          },
          animatedStyle,
        ]}
      >
        <Image
          source={{ uri: src }}
          style={[
            {
              width: layer.width,
              height: layer.height,
              borderRadius: 8,
              opacity: 1,
              borderWidth: 2,
              borderColor: isSelected ? colors.primary : "transparent",
            },
          ]}
          contentFit="cover"
          key={src}
        />
      </Animated.View>
    </GestureDetector>
  );
};
