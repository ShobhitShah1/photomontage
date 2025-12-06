import { useCallback, useMemo } from "react";
import { Gesture } from "react-native-gesture-handler";
import {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

type Params = {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  onSelect: () => void;
  onChange: (next: {
    x: number;
    y: number;
    scale: number;
    rotation: number;
  }) => void;
};

export const useTransformGesture = ({
  x,
  y,
  scale,
  rotation,
  onSelect,
  onChange,
}: Params) => {
  // All shared values for transform state
  const tx = useSharedValue(x);
  const ty = useSharedValue(y);
  const ts = useSharedValue(scale);
  const tr = useSharedValue(rotation);

  // Context values for gesture start positions
  const startX = useSharedValue(x);
  const startY = useSharedValue(y);
  const startScale = useSharedValue(scale);
  const startRotation = useSharedValue(rotation);

  // Memoize the sync function to prevent recreating on every render
  const sync = useCallback((nx: number, ny: number, ns: number, nr: number) => {
    tx.value = withTiming(nx, { duration: 100 });
    ty.value = withTiming(ny, { duration: 100 });
    ts.value = withTiming(ns, { duration: 100 });
    tr.value = withTiming(nr, { duration: 100 });
  }, []);

  // Create all gestures in a single useMemo to avoid recreation
  const gesture = useMemo(() => {
    const tap = Gesture.Tap().onEnd(() => {
      "worklet";
      scheduleOnRN(onSelect);
    });

    const longPress = Gesture.LongPress()
      .minDuration(300)
      .onEnd(() => {
        "worklet";
        scheduleOnRN(onSelect);
      });

    const pan = Gesture.Pan()
      .minDistance(1)
      .onStart(() => {
        "worklet";
        startX.value = tx.value;
        startY.value = ty.value;
      })
      .onUpdate((e) => {
        "worklet";
        tx.value = startX.value + e.translationX;
        ty.value = startY.value + e.translationY;
      })
      .onEnd(() => {
        "worklet";
        scheduleOnRN(onChange, {
          x: tx.value,
          y: ty.value,
          scale: ts.value,
          rotation: tr.value,
        });
      });

    const pinch = Gesture.Pinch()
      .onStart(() => {
        "worklet";
        startScale.value = ts.value;
      })
      .onUpdate((e) => {
        "worklet";
        ts.value = startScale.value * e.scale;
      })
      .onEnd(() => {
        "worklet";
        scheduleOnRN(onChange, {
          x: tx.value,
          y: ty.value,
          scale: ts.value,
          rotation: tr.value,
        });
      });

    const rotate = Gesture.Rotation()
      .onStart(() => {
        "worklet";
        startRotation.value = tr.value;
      })
      .onUpdate((e) => {
        "worklet";
        const rotDeg = (e.rotation * 180) / Math.PI;
        tr.value = startRotation.value + rotDeg;
      })
      .onEnd(() => {
        "worklet";
        scheduleOnRN(onChange, {
          x: tx.value,
          y: ty.value,
          scale: ts.value,
          rotation: tr.value,
        });
      });

    // Combine gestures: pan, pinch, and rotate can happen simultaneously
    // Tap and long press race against the combined gesture
    const simultaneous = Gesture.Simultaneous(pan, pinch, rotate);
    return Gesture.Race(tap, longPress, simultaneous);
  }, [onSelect, onChange]);

  // Animated style runs on UI thread - no JS bridge needed during animation
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { rotateZ: `${tr.value}deg` },
      { scale: ts.value },
    ],
  }));

  return { gesture, animatedStyle, sync } as const;
};
