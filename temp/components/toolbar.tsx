import { FontFamily } from "@/constants/fonts";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors, radii, spacing } from "../../utiles/tokens";

interface ToolbarProps {
  onAdd: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onGridToggle: () => void;
  onRandomize: () => void;
  onExport: () => void;
}

const Btn: React.FC<{ title: string; onPress: () => void }> = ({
  title,
  onPress,
}) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      {
        backgroundColor: colors.surface,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: radii.md,
        marginHorizontal: spacing.xs,
      },
      pressed && { backgroundColor: "rgba(0,0,0,0.1)" },
    ]}
  >
    <Text
      style={{
        color: colors.text,
        fontSize: 14,
        fontFamily: FontFamily.semibold,
      }}
    >
      {title}
    </Text>
  </Pressable>
);

export const Toolbar: React.FC<ToolbarProps> = ({
  onAdd,
  onUndo,
  onRedo,
  onGridToggle,
  onRandomize,
  onExport,
}) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
    }}
  >
    <Btn title="Add" onPress={onAdd} />
    <Btn title="Undo" onPress={onUndo} />
    <Btn title="Redo" onPress={onRedo} />
    <Btn title="Grid" onPress={onGridToggle} />
    <Btn title="🪄" onPress={onRandomize} />
    <Btn title="Export" onPress={onExport} />
  </View>
);
