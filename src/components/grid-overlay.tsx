import React from "react";
import { View } from "react-native";
import { colors } from "../theme/tokens";

interface GridOverlayProps {
  width: number;
  height: number;
  spacing: number;
  visible?: boolean;
}

export const GridOverlay: React.FC<GridOverlayProps> = ({
  width,
  height,
  spacing,
  visible = true,
}) => {
  if (!visible) return null;
  const cols = Math.floor(width / spacing);
  const rows = Math.floor(height / spacing);
  const line = { backgroundColor: colors.border, opacity: 0.5 };
  return (
    <View pointerEvents="none" style={{ position: "absolute", width, height }}>
      {Array.from({ length: cols + 1 }).map((_, i) => (
        <View
          key={`v-${i}`}
          style={{
            position: "absolute",
            left: i * spacing,
            top: 0,
            width: 1,
            height,
            ...line,
          }}
        />
      ))}
      {Array.from({ length: rows + 1 }).map((_, i) => (
        <View
          key={`h-${i}`}
          style={{
            position: "absolute",
            top: i * spacing,
            left: 0,
            height: 1,
            width,
            ...line,
          }}
        />
      ))}
    </View>
  );
};
