import { useMemo } from "react";
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
  const tx = useSharedValue(x);
  const ty = useSharedValue(y);
  const ts = useSharedValue(scale);
  const tr = useSharedValue(rotation);
  const sx = useSharedValue(scale);
  const sr = useSharedValue(rotation);
  const px = useSharedValue(x);
  const py = useSharedValue(y);

  const tap = Gesture.Tap().onEnd(() => scheduleOnRN(onSelect));
  const longPress = Gesture.LongPress().onEnd(() => scheduleOnRN(onSelect));

  const pan = Gesture.Pan()
    .onStart(() => {
      px.value = tx.value;
      py.value = ty.value;
    })
    .onChange((e) => {
      const nx = px.value + e.translationX;
      const ny = py.value + e.translationY;
      if (Number.isFinite(nx)) tx.value = nx;
      if (Number.isFinite(ny)) ty.value = ny;
    })
    .onEnd(() =>
      scheduleOnRN(onChange, {
        x: tx.value,
        y: ty.value,
        scale: ts.value,
        rotation: tr.value,
      })
    );

  const pinch = Gesture.Pinch()
    .onStart(() => {
      sx.value = ts.value;
    })
    .onChange((e) => {
      const scaleVal = e.scale || 1;
      const next = sx.value * scaleVal;
      ts.value = next;
      // ts.value = Math.max(0.2, Math.min(6, next));
    })
    .onEnd(() =>
      scheduleOnRN(onChange, {
        x: tx.value,
        y: ty.value,
        scale: ts.value,
        rotation: tr.value,
      })
    );

  const rotate = Gesture.Rotation()
    .onStart(() => {
      sr.value = tr.value;
    })
    .onChange((e) => {
      const rot = ((e.rotation ?? 0) * 180) / Math.PI;
      const next = sr.value + rot;
      if (Number.isFinite(next)) tr.value = next;
    })
    .onEnd(() =>
      scheduleOnRN(onChange, {
        x: tx.value,
        y: ty.value,
        scale: ts.value,
        rotation: tr.value,
      })
    );

  const combinedPanPinchRotate = Gesture.Simultaneous(pinch, rotate, pan);
  const composed = useMemo(
    () => Gesture.Race(tap, longPress, combinedPanPinchRotate),
    [tap, longPress, combinedPanPinchRotate]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { rotateZ: `${tr.value}deg` },
      { scale: ts.value },
    ],
  }));

  const sync = (nx: number, ny: number, ns: number, nr: number) => {
    tx.value = withTiming(nx, { duration: 120 });
    ty.value = withTiming(ny, { duration: 120 });
    ts.value = withTiming(ns, { duration: 120 });
    tr.value = withTiming(nr, { duration: 120 });
  };

  return { gesture: composed, animatedStyle, sync } as const;
};
