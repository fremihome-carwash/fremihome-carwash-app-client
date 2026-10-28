import React from "react";
import { StyleSheet, Pressable, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface CardProps {
  /** 1 = bg-card (white), 2 = secondary (slate-100), 3 = tertiary (slate-200) */
  elevation?: number;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  /** Set false to disable inner padding (matches shadcn raw <Card>) */
  padded?: boolean;
}

const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.3,
  stiffness: 150,
  overshootClamping: true,
  energyThreshold: 0.001,
};

const getBackgroundColorForElevation = (
  elevation: number,
  theme: any,
): string => {
  switch (elevation) {
    case 1:
      return theme.backgroundDefault;
    case 2:
      return theme.backgroundSecondary;
    case 3:
      return theme.backgroundTertiary;
    default:
      return theme.backgroundDefault;
  }
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Card primitive — visually aligned with shadcn `<Card>`:
 *   rounded-xl (12) · border · bg-card · shadow
 * Padding by default is `Spacing.xl` (~24, matches shadcn p-6).
 * Pass `padded={false}` for an unpadded shell (lists, dividers, etc.).
 */
export function Card({
  elevation = 1,
  title,
  description,
  children,
  onPress,
  style,
  padded = true,
}: CardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const cardBackgroundColor = getBackgroundColorForElevation(elevation, theme);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) scale.value = withSpring(0.98, springConfig);
  };

  const handlePressOut = () => {
    if (onPress) scale.value = withSpring(1, springConfig);
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.card,
        padded && styles.padded,
        {
          backgroundColor: cardBackgroundColor,
          borderColor: theme.backgroundTertiary,
        },
        animatedStyle,
        style,
      ]}
    >
      {title ? (
        <ThemedText style={styles.cardTitle}>{title}</ThemedText>
      ) : null}
      {description ? (
        <ThemedText style={[styles.cardDescription, { color: theme.textSecondary }]}>
          {description}
        </ThemedText>
      ) : null}
      {children}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.sm, // 12 — match shadcn `rounded-xl`
    borderWidth: 1,
    // subtle shadow matching shadcn default `shadow`
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  padded: {
    padding: Spacing["2xl"], // 24 — match shadcn `p-6`
  },
  cardTitle: {
    fontSize: 16, // shadcn CardTitle: font-semibold leading-none tracking-tight
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  cardDescription: {
    fontSize: 14, // shadcn CardDescription: text-sm
  },
});
