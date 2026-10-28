import React, { useCallback, useState } from "react";
import { StyleSheet, View, ScrollView, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import {
  getUserData,
  UserData,
  getActiveMemberships,
  getDaysRemaining,
  Package,
  Membership,
  PACKAGES,
} from "@/lib/storage";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "BookingPaymentSelection">;

export default function BookingPaymentSelectionScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    const data = await getUserData();
    setUserData(data);
    setIsLoading(false);
  };

  const handlePayDirectly = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("VehicleSelection");
  };

  const handleUsePackage = (_membershipId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("VehicleSelection");
  };

  const handleBuyPackage = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("PackageVehicleSelection");
  };

  const activeMemberships = userData ? getActiveMemberships(userData) : [];

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.skeleton, { backgroundColor: theme.backgroundSecondary }]} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <ThemedText type="h2" style={styles.title}>
            ¿Cómo deseas pagar?
          </ThemedText>
          <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
            Elige pagar directamente o usar uno de tus paquetes activos.
          </ThemedText>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Pressable
            onPress={handlePayDirectly}
            style={({ pressed }) => [
              styles.optionCard,
              {
                backgroundColor: theme.backgroundSecondary,
                borderColor: theme.backgroundTertiary,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <View style={[styles.optionIcon, { backgroundColor: Colors.primary + "15" }]}>
              <Feather name="credit-card" size={28} color={Colors.primary} />
            </View>
            <View style={styles.optionInfo}>
              <ThemedText type="h3">Pago Directo</ThemedText>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Paga esta lavada individualmente
              </ThemedText>
            </View>
            <Feather name="chevron-right" size={24} color={theme.textSecondary} />
          </Pressable>
        </Animated.View>

        {activeMemberships.length > 0 ? (
          <>
            <Animated.View entering={FadeInDown.delay(150).springify()}>
              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: theme.backgroundTertiary }]} />
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  O usa un paquete
                </ThemedText>
                <View style={[styles.dividerLine, { backgroundColor: theme.backgroundTertiary }]} />
              </View>
            </Animated.View>

            {activeMemberships.map(({ package: pkg, membership, daysRemaining }, index) => (
              <Animated.View
                key={membership.id}
                entering={FadeInDown.delay(200 + index * 50).springify()}
              >
                <Pressable
                  onPress={() => handleUsePackage(membership.id)}
                  style={({ pressed }) => [
                    styles.packageOption,
                    {
                      backgroundColor: pkg.color + "15",
                      borderColor: pkg.color,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <View style={[styles.packageIcon, { backgroundColor: pkg.color }]}>
                    <Feather
                      name={pkg.id === "premium" ? "award" : pkg.id === "completo" ? "star" : "check-circle"}
                      size={24}
                      color="#FFFFFF"
                    />
                  </View>
                  <View style={styles.packageInfo}>
                    <ThemedText type="h3">{pkg.name}</ThemedText>
                    <View style={styles.packageMeta}>
                      <View style={styles.metaItem}>
                        <Feather name="droplet" size={14} color={pkg.color} />
                        <ThemedText type="caption" style={{ color: pkg.color, fontWeight: "600" }}>
                          {membership.washesRemaining} lavadas
                        </ThemedText>
                      </View>
                      <View style={styles.metaItem}>
                        <Feather name="clock" size={14} color={theme.textSecondary} />
                        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                          {daysRemaining} días
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                  <Feather name="chevron-right" size={24} color={pkg.color} />
                </Pressable>
              </Animated.View>
            ))}
          </>
        ) : (
          <Animated.View entering={FadeInDown.delay(150).springify()}>
            <Card elevation={1} style={styles.noPackagesCard}>
              <View style={styles.noPackagesContent}>
                <Feather
                  name="package"
                  size={32}
                  color={isDark ? Colors.accent : Colors.primary}
                />
                <View style={styles.noPackagesText}>
                  <ThemedText type="body" style={{ fontWeight: "600" }}>
                    ¿Aún sin paquete?
                  </ThemedText>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    Ahorra con nuestros paquetes de lavadas
                  </ThemedText>
                </View>
              </View>
              <Button
                onPress={handleBuyPackage}
                style={styles.buyPackageButton}
              >
                Ver Paquetes
              </Button>
            </Card>
          </Animated.View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  skeleton: {
    margin: Spacing.xl,
    height: 200,
    borderRadius: BorderRadius.lg,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  subtitle: {
    marginBottom: Spacing.sm,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  optionInfo: {
    flex: 1,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginVertical: Spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  packageOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    gap: Spacing.md,
  },
  packageIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  packageInfo: {
    flex: 1,
  },
  packageMeta: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  noPackagesCard: {
    marginTop: Spacing.md,
  },
  noPackagesContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  noPackagesText: {
    flex: 1,
  },
  buyPackageButton: {
    backgroundColor: Colors.primary,
  },
});
