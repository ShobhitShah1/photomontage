import { useCallback, useMemo, useRef } from "react";
import { Gesture } from "react-native-gesture-handler";
import { useAnimatedStyle, useSharedValue } from "react-native-reanimated";
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
  // Use refs to avoid recreating gestures when callbacks change
  const onSelectRef = useRef(onSelect);
  const onChangeRef = useRef(onChange);
  onSelectRef.current = onSelect;
  onChangeRef.current = onChange;

  // Stable callback wrappers that use refs
  const stableOnSelect = useCallback(() => {
    onSelectRef.current();
  }, []);

  const stableOnChange = useCallback(
    (next: { x: number; y: number; scale: number; rotation: number }) => {
      onChangeRef.current(next);
    },
    []
  );

  // All shared values for transform state
  const tx = useSharedValue(x);
  const ty = useSharedValue(y);
  const ts = useSharedValue(scale);
  const tr = useSharedValue(rotation);

  // Flag to track if gesture is active (prevents sync during gesture)
  const isGestureActive = useSharedValue(false);

  // Context values for gesture start positions
  const startX = useSharedValue(x);
  const startY = useSharedValue(y);
  const startScale = useSharedValue(scale);
  const startRotation = useSharedValue(rotation);

  // Sync function - ONLY used for external prop changes, NOT during gestures
  // Direct assignment without animation for immediate sync
  const sync = useCallback((nx: number, ny: number, ns: number, nr: number) => {
    // Only sync if gesture is not active to avoid fighting with UI thread
    if (!isGestureActive.value) {
      tx.value = nx;
      ty.value = ny;
      ts.value = ns;
      tr.value = nr;
    }
  }, []);

  // Create all gestures in a single useMemo with STABLE dependencies
  const gesture = useMemo(() => {
    const tap = Gesture.Tap().onEnd(() => {
      "worklet";
      scheduleOnRN(stableOnSelect);
    });

    const longPress = Gesture.LongPress()
      .minDuration(300)
      .onEnd(() => {
        "worklet";
        scheduleOnRN(stableOnSelect);
      });

    const pan = Gesture.Pan()
      .minDistance(1)
      .onStart(() => {
        "worklet";
        isGestureActive.value = true;
        startX.value = tx.value;
        startY.value = ty.value;
      })
      .onUpdate((e) => {
        "worklet";
        // Pure UI thread - no JS bridge during drag
        tx.value = startX.value + e.translationX;
        ty.value = startY.value + e.translationY;
      })
      .onEnd(() => {
        "worklet";
        isGestureActive.value = false;
        // Only sync to React state at the END of gesture
        scheduleOnRN(stableOnChange, {
          x: tx.value,
          y: ty.value,
          scale: ts.value,
          rotation: tr.value,
        });
      });

    const pinch = Gesture.Pinch()
      .onStart(() => {
        "worklet";
        isGestureActive.value = true;
        startScale.value = ts.value;
      })
      .onUpdate((e) => {
        "worklet";
        // Pure UI thread - no JS bridge during pinch
        ts.value = startScale.value * e.scale;
      })
      .onEnd(() => {
        "worklet";
        isGestureActive.value = false;
        scheduleOnRN(stableOnChange, {
          x: tx.value,
          y: ty.value,
          scale: ts.value,
          rotation: tr.value,
        });
      });

    const rotate = Gesture.Rotation()
      .onStart(() => {
        "worklet";
        isGestureActive.value = true;
        startRotation.value = tr.value;
      })
      .onUpdate((e) => {
        "worklet";
        // Pure UI thread - no JS bridge during rotation
        const rotDeg = (e.rotation * 180) / Math.PI;
        tr.value = startRotation.value + rotDeg;
      })
      .onEnd(() => {
        "worklet";
        isGestureActive.value = false;
        scheduleOnRN(stableOnChange, {
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
  }, [stableOnSelect, stableOnChange]); // These are now STABLE!

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
