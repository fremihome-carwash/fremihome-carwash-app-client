import { Platform } from "react-native";
import { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { isLiquidGlassAvailable } from "expo-glass-effect";

import { useTheme } from "@/hooks/useTheme";

interface UseScreenOptionsParams {
  transparent?: boolean;
}

/**
 * Shared screen options for native-stack screens.
 *
 * Alineado visualmente con el `AppHeader` de cw_platf / cw_cmp:
 *   - título "text-lg font-semibold" → fontSize 18, weight 600
 *   - alineación izquierda
 *   - border bottom sutil (matchea `border-b` de Tailwind)
 *   - back button a la izquierda (default de React Navigation)
 */
export function useScreenOptions({
  transparent = false,
}: UseScreenOptionsParams = {}): NativeStackNavigationOptions {
  const { theme, isDark } = useTheme();

  return {
    headerTitleAlign: "left",
    headerTitleStyle: {
      fontSize: 18,
      fontWeight: "600",
    },
    headerTintColor: theme.text,
    headerTransparent: transparent,
    headerBlurEffect: isDark ? "dark" : "light",
    headerShadowVisible: false,
    headerStyle: {
      backgroundColor: Platform.select({
        ios: transparent ? undefined : theme.backgroundDefault,
        android: theme.backgroundDefault,
        web: theme.backgroundDefault,
      }),
      // border-bottom (matchea `border-b` del AppHeader web). Sólo aplica en web/Android.
      borderBottomWidth: Platform.OS === "ios" ? 0 : 1,
      borderBottomColor: theme.backgroundTertiary,
    } as NativeStackNavigationOptions["headerStyle"],
    headerBackTitle: "",
    headerBackTitleVisible: false,
    gestureEnabled: true,
    gestureDirection: "horizontal",
    fullScreenGestureEnabled: isLiquidGlassAvailable() ? false : true,
    contentStyle: {
      backgroundColor: theme.backgroundRoot,
    },
  } as NativeStackNavigationOptions;
}
