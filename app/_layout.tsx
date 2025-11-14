import {
  ThemeProvider as CustomThemeProvider,
  useTheme,
} from "@/context/theme-context";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import BootSplash from "react-native-bootsplash";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const prepare = async () => {
      try {
        // Keep the splash screen visible for a bit, or until your app is ready
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        setIsReady(true);
        await BootSplash.hide();
      }
    };

    prepare();
  }, []);

  if (!isReady) {
    return null;
  }

  function ThemedNavigator() {
    const { isDark } = useTheme();

    return (
      <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ animation: "ios_from_right" }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="preview" options={{ headerShown: false }} />
          <Stack.Screen name="editor" options={{ headerShown: false }} />
        </Stack>
      </ThemeProvider>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <CustomThemeProvider>
        <ThemedNavigator />
      </CustomThemeProvider>
    </GestureHandlerRootView>
  );
}
