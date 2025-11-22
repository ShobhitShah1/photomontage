import { StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface DraggablePreviewProps {
  children: React.ReactNode;
  containerWidth: number;
  containerHeight: number;
  itemWidth: number;
  itemHeight: number;
}

export const DraggablePreview = ({
  children,
  containerWidth,
  containerHeight,
  itemWidth,
  itemHeight,
}: DraggablePreviewProps) => {
  const isExpanded = useSharedValue(false);
  const isHidden = useSharedValue(false);

  const x = useSharedValue(20);
  const y = useSharedValue(containerHeight - itemHeight - 20);
  const context = useSharedValue({ x: 0, y: 0 });

  const MAX_X = containerWidth - itemWidth;
  const MAX_Y = containerHeight - itemHeight;

  const animationConfig = {
    duration: 350,
    easing: Easing.out(Easing.cubic),
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      if (isExpanded.value) return;
      context.value = { x: x.value, y: y.value };
    })
    .onUpdate((e) => {
      if (isExpanded.value) return;
      const nextX = context.value.x + e.translationX;
      const nextY = context.value.y + e.translationY;
      x.value = Math.min(Math.max(nextX, 0), MAX_X);
      y.value = Math.min(Math.max(nextY, 0), MAX_Y);
    });

  const tapGesture = Gesture.Tap()
    .maxDuration(250)
    .onEnd(() => {
      isExpanded.value = !isExpanded.value;
    });

  const longPressGesture = Gesture.LongPress()
    .minDuration(400)
    .onStart(() => {
      isHidden.value = true;
    })
    .onFinalize(() => {
      isHidden.value = false;
    });

  const composedGestures = Gesture.Simultaneous(
    panGesture,
    tapGesture,
    longPressGesture
  );

  const animatedStyle = useAnimatedStyle(() => {
    const scaleRatio = Math.min(
      (containerWidth * 0.9) / itemWidth,
      (containerHeight * 0.8) / itemHeight
    );

    const targetScale = isExpanded.value ? scaleRatio : 1;

    const centerX = (containerWidth - itemWidth) / 2;
    const centerY = (containerHeight - itemHeight) / 2;

    const targetX = isExpanded.value ? centerX : x.value;
    const targetY = isExpanded.value ? centerY : y.value;

    return {
      transform: [
        { translateX: withTiming(targetX, animationConfig) },
        { translateY: withTiming(targetY, animationConfig) },
        { scale: withTiming(targetScale, animationConfig) },
      ],
      opacity: withTiming(isHidden.value ? 0 : 1, { duration: 200 }),
      zIndex: isExpanded.value ? 9999 : 100,
    };
  });

  return (
    <GestureDetector gesture={composedGestures}>
      <Animated.View
        style={[
          styles.previewContainer,
          { width: itemWidth, height: itemHeight },
          animatedStyle,
        ]}
      >
        {children}
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  previewContainer: {
    position: "absolute",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderRadius: 8,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
});
