import { ic_gallery, ic_home, ic_setting, ic_upload } from "@/assets/icons";
import colors from "@/constants/colors";
import { FontFamily } from "@/constants/fonts";
import { useTheme } from "@/context/theme-context";
import {
  mapAssetsToImages,
  useSelectionStore,
  type SelectionSource,
} from "@/store/selection-store";
import { useEditorStore } from "@/store/store";
import { ImagePickerModal } from "@/temp/components/image-picker-modal";
import type { ImagePickerAsset } from "expo-image-picker";
import { Tabs, usePathname, useRouter } from "expo-router";
import React, { memo, useCallback, useEffect, useState } from "react";
import {
  BackHandler,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface TabItemProps {
  label: string;
  imageSource: number;
  isFocused: boolean;
  onPress: () => void;
  isCenter?: boolean;
}

interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
  onCenterPress: () => void;
}

const TabItem: React.FC<TabItemProps> = memo(
  ({ label, isFocused, onPress, imageSource, isCenter = false }) => {
    const { theme } = useTheme();
    const bubbleScale = useSharedValue(0);
    const bubbleOpacity = useSharedValue(0);
    const iconTranslateY = useSharedValue(0);

    useEffect(() => {
      "worklet";

      const config = {
        duration: 200,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      };

      if (isFocused) {
        bubbleOpacity.value = withTiming(1, config);
        bubbleScale.value = withTiming(1, config);
        iconTranslateY.value = withTiming(-23, config);
      } else {
        iconTranslateY.value = withTiming(0, config);
        bubbleScale.value = withTiming(0, config);
        bubbleOpacity.value = withTiming(0, config);
      }
    }, [isFocused]);

    const bubbleStyle = useAnimatedStyle(() => {
      "worklet";
      return {
        transform: [{ scale: bubbleScale.value }],
        opacity: bubbleOpacity.value,
      };
    });

    const iconStyle = useAnimatedStyle(() => {
      "worklet";
      return {
        transform: [{ translateY: iconTranslateY.value }],
      };
    });

    const iconSize = useAnimatedStyle(() => {
      "worklet";
      return {
        width: withTiming(isFocused ? (isCenter ? 25 : 22) : 21),
        height: withTiming(isFocused ? (isCenter ? 25 : 22) : 21),
      };
    });

    return (
      <Pressable onPress={onPress} style={styles.tabItem}>
        <Animated.View
          style={[
            styles.bubbleBackground,
            bubbleStyle,
            { backgroundColor: colors.dark.primary },
          ]}
        />

        <Animated.View style={[styles.iconContainer, iconStyle]}>
          <Animated.Image
            source={isCenter && isFocused ? ic_upload : imageSource}
            tintColor={isFocused ? "#000" : undefined}
            style={iconSize}
            resizeMode="contain"
          />
        </Animated.View>

        {isFocused && (
          <Text
            style={[
              styles.tabLabel,
              { color: theme.textPrimary, fontSize: 12.5 },
            ]}
          >
            {label?.toString()}
          </Text>
        )}
      </Pressable>
    );
  }
);

const CustomTabBar: React.FC<CustomTabBarProps> = ({
  state,
  descriptors,
  navigation,
  onCenterPress,
}) => {
  const { theme, isDark } = useTheme();

  const handleTabPress = useCallback(
    (routeName: string) => {
      if (routeName === "index" && state.index === 1) {
        onCenterPress();
        return;
      }

      const event = navigation.emit({
        type: "tabPress",
        target: routeName,
        canPreventDefault: true,
      });

      if (!event.defaultPrevented) {
        requestAnimationFrame(() => {
          navigation.navigate(routeName);
        });
      }
    },
    [state.index, navigation]
  );

  return (
    <>
      <View style={styles.tabContainer}>
        <View
          style={[
            styles.floatingBar,
            { backgroundColor: isDark ? theme.cardBackground : "#FFFFFF" },
          ]}
        >
          <TabItem
            label="Gallery"
            imageSource={ic_gallery}
            isFocused={state.index === 0}
            onPress={() => handleTabPress("gallery")}
          />

          <TabItem
            label="Home"
            imageSource={ic_home}
            isFocused={state.index === 1}
            onPress={() => handleTabPress("index")}
            isCenter={true}
          />

          <TabItem
            label="Settings"
            imageSource={ic_setting}
            isFocused={state.index === 2}
            onPress={() => handleTabPress("settings")}
          />
        </View>
      </View>
    </>
  );
};

export default function TabLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const [pickerVisible, setPickerVisible] = useState(false);
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);
  const beginSession = useSelectionStore((state) => state.beginSession);
  const resetEditor = useEditorStore((state) => state.reset);

  const handlePicked = useCallback(
    (assets: ImagePickerAsset[], source: SelectionSource) => {
      const prepared = mapAssetsToImages(assets, source);
      if (prepared.length === 0) {
        setPickerVisible(false);
        return;
      }
      beginSession(prepared);
      resetEditor();
      setPickerVisible(false);
      router.push("/preview");
    },
    [beginSession, resetEditor, router]
  );

  const openPicker = useCallback(() => {
    setPickerVisible(true);
  }, []);

  const closePicker = useCallback(() => {
    setPickerVisible(false);
  }, []);

  useEffect(() => {
    if (pathname !== "/gallery") {
      translateY.value = withTiming(100, {
        duration: 300,
        easing: Easing.in(Easing.cubic),
      });
      opacity.value = withTiming(0, {
        duration: 300,
        easing: Easing.in(Easing.cubic),
      });
    } else {
      translateY.value = withTiming(0, {
        duration: 400,
        easing: Easing.out(Easing.cubic),
      });
      opacity.value = withTiming(1, {
        duration: 400,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [pathname]);

  useEffect(() => {
    const onBackPress = () => {
      if (Platform.OS === "android" && pathname === "/index") {
        BackHandler.exitApp();
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => sub.remove();
  }, [pathname]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <>
      <Tabs
        tabBar={(props) => (
          <CustomTabBar {...props} onCenterPress={openPicker} />
        )}
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: "none" },
          animation: "none",
        }}
        initialRouteName="index"
        backBehavior="initialRoute"
      >
        <Tabs.Screen name="gallery" />
        <Tabs.Screen name="index" options={{ lazy: false }} />
        <Tabs.Screen name="settings" />
      </Tabs>

      <ImagePickerModal
        visible={pickerVisible}
        onClose={closePicker}
        onPicked={handlePicked}
      />
    </>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    position: "absolute",
    bottom: 40,
    left: 60,
    right: 60,
    zIndex: 99,
    alignItems: "center",
  },
  floatingBar: {
    flexDirection: "row",
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingVertical: 8,
    paddingHorizontal: 12,
    boxShadow: "0px 0px 25px 0px rgba(0, 0, 0, 0.15)",
    width: "100%",
    height: 55,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    height: 50,
    position: "relative",
  },
  bubbleBackground: {
    position: "absolute",
    width: 50,
    height: 50,
    borderRadius: 25,
    top: -30,
    alignSelf: "center",
  },
  gradientBubble: {
    width: "100%",
    height: "100%",
    borderRadius: 25,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    position: "relative",
  },
  centerIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  centerLottie: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 50,
    height: 50,
    borderRadius: 25,
    zIndex: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: FontFamily.semibold,
    textAlign: "center",
    color: "#000000",
    top: -2,
  },
  modalOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: "90%",
    maxWidth: 400,
  },
  iconImage: { width: 22, height: 22 },
  lottieFullFill: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: "150%",
    height: "150%",
    // Offset by 0.75*containerSize to center, container defaults to 50, so -37.5. Update if parent size changes.
    transform: [{ translateX: -37.5 }, { translateY: -37.5 }],
    zIndex: 999999,
    pointerEvents: "none",
  },
});
