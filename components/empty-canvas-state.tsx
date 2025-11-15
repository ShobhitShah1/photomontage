import { ic_upload } from "@/assets/icons";
import { Image } from "expo-image";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

export const EmptyCanvasState: React.FC = () => {
  const arrowTranslateY = useSharedValue(0);

  useEffect(() => {
    arrowTranslateY.value = withRepeat(
      withSequence(
        withTiming(10, {
          duration: 800,
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(0, {
          duration: 800,
          easing: Easing.inOut(Easing.quad),
        })
      ),
      -1,
      true
    );
  }, [arrowTranslateY]);

  const animatedArrowStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: arrowTranslateY.value }],
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.mainText}>Your Canvas is Empty</Text>
        <Text style={styles.subText}>
          Tap the{"  "}
          <Image
            source={ic_upload}
            style={{ width: 17, height: 17 }}
            tintColor={"white"}
            contentFit="contain"
          />
          {"  "}
          below to start creating
        </Text>
      </View>

      <Animated.View style={[styles.arrowContainer, animatedArrowStyle]}>
        <Svg width="60" height="100" viewBox="0 0 60 100">
          <Path
            d="M 30 10 Q 40 30, 30 50 T 30 85"
            stroke="#fff"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <Path
            d="M 30 85 L 20 75 M 30 85 L 40 75"
            stroke="#fff"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </Svg>
      </Animated.View>
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
    paddingHorizontal: 40,
  },
  mainText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 3,
  },
  subText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
  },
  highlight: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  arrowContainer: {
    position: "absolute",
    bottom: 10, // Adjust this value to sit just above your toolbar
    alignItems: "center",
    left: 10,
  },
  arrowText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginTop: -10,
  },
});

export default EmptyCanvasState;
