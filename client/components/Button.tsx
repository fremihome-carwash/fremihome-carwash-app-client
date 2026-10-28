import React, { ReactNode } from "react";
import { StyleSheet, Pressable, ViewStyle, StyleProp } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";

interface ButtonProps {
  onPress?: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  textColor?: string;
}

const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.3,
  stiffness: 150,
  overshootClamping: true,
  energyThreshold: 0.001,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  onPress,
  children,
  style,
  disabled = false,
  textColor,
}: ButtonProps) {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withSpring(0.98, springConfig);
    }
  };

  const handlePressOut = () => {
    if (!disabled) {
      scale.value = withSpring(1, springConfig);
    }
  };

  const flatStyle = StyleSheet.flatten(style);
  const bgColor = flatStyle?.backgroundColor as string | undefined;

  const getTextColor = () => {
    if (textColor) return textColor;
    if (!bgColor) return theme.buttonText;
    
    const isTransparentBg = bgColor === "transparent";
    const isSecondaryBg = 
      bgColor === theme.backgroundSecondary || 
      bgColor === theme.backgroundDefault ||
      bgColor === theme.backgroundTertiary ||
      bgColor?.includes("rgba");
    
    if (isTransparentBg || isSecondaryBg) {
      return isDark ? Colors.accent : Colors.primary;
    }
    
    return theme.buttonText;
  };

  return (
    <AnimatedPressable
      onPress={disabled ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        styles.button,
        {
          backgroundColor: Colors.primary,
          opacity: disabled ? 0.5 : 1,
        },
        style,
        animatedStyle,
      ]}
    >
      <ThemedText
        type="body"
        style={[styles.buttonText, { color: getTextColor() }]}
      >
        {children}
      </ThemedText>
    </AnimatedPressable>
  );
}

// Tokens alineados con shadcn Button (cw_platf + cw_cmp):
//   default:  min-h-9 px-4  → 36 px alto, paddingHorizontal 16
//   rounded-md → 6 px de radio
//   text-sm font-medium → 14 / 500
// En mobile usamos un poco más alto (40) para confort de touch.
const styles = StyleSheet.create({
  button: {
    height: 40,
    paddingHorizontal: Spacing.lg, // 16 — match `px-4`
    borderRadius: BorderRadius.xs, // 8 — close to shadcn rounded-md (6) but visually similar
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: Spacing.sm,
  },
  buttonText: {
    fontWeight: "500", // shadcn font-medium
    fontSize: 14, // shadcn text-sm
  },
});
