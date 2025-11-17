import { FONT_ASSETS } from "@/constants/fonts";
import {
  ThemeProvider as CustomThemeProvider,
  useTheme,
} from "@/context/theme-context";
import { FontAwesome } from "@expo/vector-icons";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import LottieView from "lottie-react-native";
import { useState } from "react";
import { StyleSheet } from "react-native";
import BootSplash from "react-native-bootsplash";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  function ThemedNavigator() {
    const [isReady, setIsReady] = useState(false);
    const [loaded, error] = useFonts({ ...FONT_ASSETS, ...FontAwesome.font });

    const { isDark } = useTheme();

    return (
      <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
        {!isReady && (
          <LottieView
            source={require("@/assets/animation/splash.json")}
            style={styles.video}
            autoPlay
            loop={false}
            onAnimationLoaded={() => {
              BootSplash.hide({ fade: true });
            }}
            onAnimationFinish={() => {
              setTimeout(() => {
                setIsReady(true);
              }, 200);
            }}
            enableSafeModeAndroid
          />
        )}

        <Stack screenOptions={{ animation: "ios_from_right" }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="preview" options={{ headerShown: false }} />
          <Stack.Screen name="editor" options={{ headerShown: false }} />
          <Stack.Screen name="gallery-view" options={{ headerShown: false }} />
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

const styles = StyleSheet.create({
  video: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f1f1f1",
    position: "absolute",
    zIndex: 999999999,
  },
});
