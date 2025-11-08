import { CanvasScreen } from "@/src/components/canvas-screen";
import { colors } from "@/src/theme/tokens";
import { StatusBar } from "expo-status-bar";
import React from "react";
import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const Index = () => (
  <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
    <StatusBar style="light" />
    <CanvasScreen />
  </GestureHandlerRootView>
);

export default Index;
