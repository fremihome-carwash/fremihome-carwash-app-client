import React, { useState, useCallback } from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";

import vehicleSmall from "../../assets/images/vehicle-small.png";
import vehicleSuv from "../../assets/images/vehicle-suv.png";
import vehicleLarge from "../../assets/images/vehicle-large.png";
import { useNavigation, useFocusEffect, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import {
  getUserData,
  getActiveMemberships,
  getIncludedServiceIds,
  getVehicleName,
  UserData,
  Package,
  Membership,
} from "@/lib/storage";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, "BookingPackageOption">;

const VEHICLE_IMAGES: Record<string, any> = {
  small: vehicleSmall,
  suv: vehicleSuv,
  large: vehicleLarge,
};

export default function BookingPackageOptionScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const { vehicleSize, addressLabel, vehicleBrand, vehicleModel, vehicleColor, vehiclePlate } = route.params;

  const [userData, setUserData] = useState<UserData | null>(null);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const data = await getUserData();
        setUserData(data);

        const actives = data ? getActiveMemberships(data) : [];
        const matching = actives.filter((a) => a.membership.vehicleSize === vehicleSize);
        if (matching.length === 0) {
          navigation.replace("ServiceCustomization", {
            vehicleSize,
            addressLabel,
            vehicleBrand,
            vehicleModel,
            vehicleColor,
            vehiclePlate,
          });
        }
      };
      load();
    }, [])
  );

  const activeMemberships = userData ? getActiveMemberships(userData) : [];
  const matchingMemberships = activeMemberships.filter((a) => a.membership.vehicleSize === vehicleSize);

  if (matchingMemberships.length === 0) {
    return <ThemedView style={styles.container} />;
  }

  const handleUsePackage = (membershipId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const selected = matchingMemberships.find((m) => m.membership.id === membershipId);
    if (!selected) return;

    const pkg = selected.package;
    const addOns = getIncludedServiceIds(pkg.washType);

    navigation.navigate("ScheduleSelection", {
      vehicleSize,
      washType: pkg.washType,
      addOns,
      totalPrice: 0,
      addressLabel,
      vehicleBrand,
      vehicleModel,
      vehicleColor,
      vehiclePlate,
      membershipId,
      packageId: pkg.id,
    });
  };

  const handleContinueNormal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("ServiceCustomization", {
      vehicleSize,
      addressLabel,
      vehicleBrand,
      vehicleModel,
      vehicleColor,
      vehiclePlate,
    });
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <ThemedText type="h2" style={styles.sectionTitle}>
            Usar paquete
          </ThemedText>
          <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.lg }}>
            Selecciona un paquete para usar una lavada incluida
          </ThemedText>
        </Animated.View>

        {matchingMemberships.map(({ package: pkg, membership, daysRemaining }, index) => {
          const duration = pkg.durations.find((d) => d.id === membership.durationId);
          const totalWashes = duration ? duration.washesIncluded : membership.washesRemaining;

          return (
            <Animated.View
              key={membership.id}
              entering={FadeInDown.delay(100 + index * 80).springify()}
            >
              <Card elevation={2} style={styles.packageCard} onPress={() => handleUsePackage(membership.id)}>
                <View style={styles.cardRow}>
                  <View style={styles.cardLeft}>
                    <Image
                      source={VEHICLE_IMAGES[membership.vehicleSize]}
                      style={styles.vehicleImage}
                      contentFit="contain"
                    />
                  </View>
                  <View style={styles.cardCenter}>
                    <View style={styles.cardTitleRow}>
                      <View style={[styles.packageDot, { backgroundColor: pkg.color }]} />
                      <ThemedText type="h3">{pkg.name}</ThemedText>
                    </View>
                    <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                      {getVehicleName(membership.vehicleSize)}
                    </ThemedText>
                    <View style={styles.cardMeta}>
                      <View style={[styles.metaChip, { backgroundColor: pkg.color + "15" }]}>
                        <ThemedText type="small" style={{ color: pkg.color, fontWeight: "700" }}>
                          {membership.washesRemaining}/{totalWashes}
                        </ThemedText>
                      </View>
                      <ThemedText type="small" style={{ color: theme.textSecondary }}>
                        {daysRemaining}d
                      </ThemedText>
                      {duration ? (
                        <ThemedText type="small" style={{ color: theme.textSecondary }}>
                          {duration.label}
                        </ThemedText>
                      ) : null}
                    </View>
                  </View>
                  <View style={[styles.useButton, { backgroundColor: pkg.color }]}>
                    <Feather name="arrow-right" size={18} color="#FFFFFF" />
                  </View>
                </View>
              </Card>
            </Animated.View>
          );
        })}

        <Animated.View entering={FadeInDown.delay(100 + matchingMemberships.length * 80).springify()}>
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: theme.backgroundTertiary }]} />
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              o
            </ThemedText>
            <View style={[styles.dividerLine, { backgroundColor: theme.backgroundTertiary }]} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150 + matchingMemberships.length * 80).springify()}>
          <Card elevation={1} style={styles.normalCard} onPress={handleContinueNormal}>
            <View style={styles.normalCardRow}>
              <View style={[styles.normalIcon, { backgroundColor: theme.backgroundSecondary }]}>
                <Feather name="credit-card" size={22} color={theme.textSecondary} />
              </View>
              <View style={styles.normalCardText}>
                <ThemedText type="h3">Continuar sin paquete</ThemedText>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  Elige servicios y paga individualmente
                </ThemedText>
              </View>
              <Feather name="chevron-right" size={22} color={theme.textSecondary} />
            </View>
          </Card>
        </Animated.View>
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
  scrollContent: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.xs,
  },
  packageCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  cardLeft: {
    width: 64,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleImage: {
    width: 60,
    height: 40,
  },
  cardCenter: {
    flex: 1,
    gap: 2,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  packageDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  metaChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  useButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  normalCard: {
    padding: Spacing.lg,
  },
  normalCardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  normalIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  normalCardText: {
    flex: 1,
    gap: Spacing.xs,
  },
});
