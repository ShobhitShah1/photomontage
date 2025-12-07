import { Theme } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface PermissionItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  isGranted: boolean;
  theme: Theme;
  onPress: () => void;
}

export function PermissionItem({
  icon,
  title,
  description,
  isGranted,
  theme,
  onPress,
}: PermissionItemProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: theme.cardBackground,
          borderColor: isGranted ? theme.success : "transparent",
          borderWidth: isGranted ? 1 : 0,
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View
        style={[
          styles.icon,
          {
            backgroundColor: isGranted
              ? "rgba(52, 199, 89, 0.1)"
              : "rgba(248, 217, 57, 0.1)",
          },
        ]}
      >
        <Ionicons
          name={isGranted ? "checkmark-circle" : icon}
          size={24}
          color={isGranted ? theme.success : theme.primary}
        />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          {title}
        </Text>
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          {description}
        </Text>
      </View>
      {isGranted && (
        <View style={[styles.badge, { backgroundColor: theme.success }]}>
          <Ionicons name="checkmark" size={14} color="white" />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
});
