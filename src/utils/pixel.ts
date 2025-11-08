import { PixelRatio } from "react-native";

export const dpr = () => PixelRatio.get();

export const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max);

export const snap = (v: number, step = 1) => Math.round(v / step) * step;

export const deg2rad = (deg: number) => (deg * Math.PI) / 180;

export const rad2deg = (rad: number) => (rad * 180) / Math.PI;

export const estimateMaxPixels = () => {
  const ratio = dpr();
  const budgetMP = ratio > 2.5 ? 9 : 6; // heuristic megapixel budget
  return budgetMP * 1_000_000;
};
