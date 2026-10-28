import React, { useCallback, useState } from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useFocusEffect, useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import vehicleSmall from "../../assets/images/vehicle-small.png";
import vehicleSuv from "../../assets/images/vehicle-suv.png";
import vehicleLarge from "../../assets/images/vehicle-large.png";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import {
  getUserData,
  UserData,
  PACKAGES,
  ALL_SERVICES,
  ADD_ONS,
  getIncludedServiceIds,
  getVehicleName,
  formatPrice,
  VehicleSize,
} from "@/lib/storage";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "MembershipPackageDetail">;
type RouteType = RouteProp<RootStackParamList, "MembershipPackageDetail">;

const VEHICLE_IMAGES: Record<VehicleSize, any> = {
  small: vehicleSmall,
  suv: vehicleSuv,
  large: vehicleLarge,
};

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}

export default function MembershipPackageDetailScreen() {
  const route = useRoute<RouteType>();
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      getUserData().then((d) => {
        setUserData(d);
        setLoading(false);
      });
    }, []),
  );

  if (loading || !userData) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.skeleton, { backgroundColor: theme.backgroundSecondary }]} />
      </ThemedView>
    );
  }

  const membership = userData.memberships.find((m) => m.id === route.params.membershipId);
  const pkg = membership ? PACKAGES.find((p) => p.id === membership.packageId) : null;

  if (!membership || !pkg) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.emptyState, { paddingBottom: insets.bottom + Spacing.xl }]}>
          <Feather name="alert-circle" size={48} color={theme.textSecondary} />
          <ThemedText type="h3" style={{ marginTop: Spacing.lg }}>
            Paquete no encontrado
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  const duration = pkg.durations.find((d) => d.id === membership.durationId);
  const totalWashes = duration ? duration.washesIncluded : membership.washesRemaining;
  const usedWashes = Math.max(0, totalWashes - membership.washesRemaining);
  const pricePaid = duration?.prices[membership.vehicleSize] ?? 0;
  const expDate = new Date(membership.expirationDate);
  const now = new Date();
  const daysRemaining = Math.max(0, Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const progressPercent = totalWashes > 0 ? (membership.washesRemaining / totalWashes) * 100 : 0;

  const includedServiceIds = getIncludedServiceIds(pkg.washType);
  const includedServices = ALL_SERVICES.filter((s) => includedServiceIds.includes(s.id));

  const matchingVehicles = userData.vehicles.filter((v) => v.size === membership.vehicleSize);

  const addOnsIncluded = pkg.addOnsIncluded
    .map((a) => {
      const addOn = ADD_ONS.find((x) => x.id === a.addOnId);
      const usedCount = membership.addOnUsage[a.addOnId] ?? a.includedUses;
      return addOn ? { addOn, includedUses: a.includedUses, remaining: usedCount } : null;
    })
    .filter((x): x is { addOn: { id: string; name: string; price: number }; includedUses: number; remaining: number } => x !== null);

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <Card elevation={2} style={styles.headerCard}>
            <View style={[styles.vehicleBanner, { backgroundColor: `${pkg.color}10` }]}>
              <Image
                source={VEHICLE_IMAGES[membership.vehicleSize]}
                style={styles.vehicleBannerImage}
                contentFit="contain"
              />
              <ThemedText type="h3">{getVehicleName(membership.vehicleSize)}</ThemedText>
            </View>
            <View style={styles.packageHeader}>
              <View style={[styles.packageIcon, { backgroundColor: `${pkg.color}20` }]}>
                <Feather name="award" size={24} color={pkg.color} />
              </View>
              <View style={{ flex: 1, gap: Spacing.xs }}>
                <ThemedText type="h2">{pkg.name}</ThemedText>
                {pkg.description ? (
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    {pkg.description}
                  </ThemedText>
                ) : null}
              </View>
            </View>

            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progressPercent}%`, backgroundColor: pkg.color },
                ]}
              />
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statBlock}>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  Restantes
                </ThemedText>
                <ThemedText type="h2" style={{ color: pkg.color }}>
                  {membership.washesRemaining}
                </ThemedText>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  de {totalWashes} lavadas
                </ThemedText>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.backgroundTertiary }]} />
              <View style={styles.statBlock}>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  Días restantes
                </ThemedText>
                <ThemedText type="h2" style={{ color: pkg.color }}>
                  {daysRemaining}
                </ThemedText>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  vence {formatShortDate(membership.expirationDate)}
                </ThemedText>
              </View>
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(75).springify()}>
          <Button
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigation.navigate("VehicleSelection", { membershipId: membership.id });
            }}
            style={[styles.bookButton, { backgroundColor: pkg.color }]}
          >
            Agendar Cita
          </Button>
        </Animated.View>

        {includedServices.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <Card elevation={1} style={styles.sectionCard}>
              <ThemedText type="h3" style={styles.sectionTitle}>
                Servicios incluidos por lavada
              </ThemedText>
              {includedServices.map((s) => (
                <View key={s.id} style={[styles.row, { borderBottomColor: theme.backgroundTertiary }]}>
                  <View style={styles.rowLeft}>
                    <Feather name="check-circle" size={16} color={Colors.success} />
                    <ThemedText type="body" style={{ flex: 1 }}>
                      {s.name}
                    </ThemedText>
                  </View>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    Incluido
                  </ThemedText>
                </View>
              ))}
            </Card>
          </Animated.View>
        ) : null}

        {addOnsIncluded.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(150).springify()}>
            <Card elevation={1} style={styles.sectionCard}>
              <ThemedText type="h3" style={styles.sectionTitle}>
                Extras incluidos
              </ThemedText>
              {addOnsIncluded.map((item) => (
                <View key={item.addOn.id} style={[styles.row, { borderBottomColor: theme.backgroundTertiary }]}>
                  <View style={styles.rowLeft}>
                    <Feather name="plus-circle" size={16} color={pkg.color} />
                    <ThemedText type="body" style={{ flex: 1 }}>
                      {item.addOn.name}
                    </ThemedText>
                  </View>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    {item.remaining}/{item.includedUses} restantes
                  </ThemedText>
                </View>
              ))}
            </Card>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Card elevation={1} style={styles.sectionCard}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Detalles del plan
            </ThemedText>
            <View style={[styles.row, { borderBottomColor: theme.backgroundTertiary }]}>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                Lavadas contratadas
              </ThemedText>
              <ThemedText type="body" style={{ fontWeight: "600" }}>
                {totalWashes}
              </ThemedText>
            </View>
            <View style={[styles.row, { borderBottomColor: theme.backgroundTertiary }]}>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                Usadas
              </ThemedText>
              <ThemedText type="body" style={{ fontWeight: "600" }}>
                {usedWashes}
              </ThemedText>
            </View>
            <View style={[styles.row, { borderBottomColor: theme.backgroundTertiary }]}>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                Vehículo
              </ThemedText>
              <ThemedText type="body" style={{ fontWeight: "600" }}>
                {getVehicleName(membership.vehicleSize)}
              </ThemedText>
            </View>
            {duration ? (
              <View style={[styles.row, { borderBottomColor: theme.backgroundTertiary }]}>
                <ThemedText type="body" style={{ color: theme.textSecondary }}>
                  Duración
                </ThemedText>
                <ThemedText type="body" style={{ fontWeight: "600" }}>
                  {duration.label}
                </ThemedText>
              </View>
            ) : null}
            <View style={[styles.row, { borderBottomColor: theme.backgroundTertiary }]}>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                Activado
              </ThemedText>
              <ThemedText type="body" style={{ fontWeight: "600" }}>
                {formatShortDate(membership.activatedAt)}
              </ThemedText>
            </View>
            <View style={[styles.row, { borderBottomColor: theme.backgroundTertiary }]}>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                Vence
              </ThemedText>
              <ThemedText type="body" style={{ fontWeight: "600" }}>
                {formatShortDate(membership.expirationDate)}
              </ThemedText>
            </View>
            <View style={[styles.row, { borderBottomWidth: 0 }]}>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                Precio pagado
              </ThemedText>
              <ThemedText type="body" style={{ fontWeight: "700", color: pkg.color }}>
                {formatPrice(pricePaid)}
              </ThemedText>
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(250).springify()}>
          <Card elevation={1} style={styles.sectionCard}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Vehículos compatibles
            </ThemedText>
            <ThemedText type="caption" style={{ color: theme.textSecondary, marginBottom: Spacing.sm }}>
              {`Sólo aplica a vehículos tamaño ${getVehicleName(membership.vehicleSize)}.`}
            </ThemedText>
            {matchingVehicles.length > 0 ? (
              matchingVehicles.map((v) => (
                <View key={v.id} style={[styles.row, { borderBottomColor: theme.backgroundTertiary }]}>
                  <View style={styles.rowLeft}>
                    <Image
                      source={VEHICLE_IMAGES[v.size]}
                      style={styles.vehicleThumb}
                      contentFit="contain"
                    />
                    <View style={{ flex: 1 }}>
                      <ThemedText type="body" style={{ fontWeight: "600" }}>
                        {v.brand} {v.model}
                      </ThemedText>
                      {v.plate ? (
                        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                          {v.plate}
                        </ThemedText>
                      ) : null}
                    </View>
                  </View>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    {v.color}
                  </ThemedText>
                </View>
              ))
            ) : (
              <View style={styles.emptyVehicles}>
                <Feather name="truck" size={20} color={theme.textSecondary} />
                <ThemedText type="caption" style={{ color: theme.textSecondary, flex: 1 }}>
                  No tienes vehículos registrados de este tamaño.
                </ThemedText>
              </View>
            )}
          </Card>
        </Animated.View>

        {pkg.perks.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <Card elevation={1} style={styles.sectionCard}>
              <ThemedText type="h3" style={styles.sectionTitle}>
                Beneficios
              </ThemedText>
              {pkg.perks.map((perk, i) => (
                <View key={i} style={styles.perkRow}>
                  <Feather name="star" size={16} color={pkg.color} />
                  <ThemedText type="body" style={{ flex: 1 }}>
                    {perk}
                  </ThemedText>
                </View>
              ))}
            </Card>
          </Animated.View>
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  content: {
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  skeleton: {
    margin: Spacing.xl,
    height: 200,
    borderRadius: BorderRadius.lg,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  headerCard: {
    paddingTop: 0,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    overflow: "hidden",
  },
  vehicleBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.lg,
    marginHorizontal: -Spacing.xl,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
  },
  vehicleBannerImage: { width: 80, height: 48 },
  packageHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  packageIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  progressBar: {
    width: "100%",
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
    marginBottom: Spacing.lg,
  },
  progressFill: { height: "100%", borderRadius: 3 },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statBlock: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  statDivider: {
    width: 1,
    height: 48,
  },
  sectionCard: {
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  sectionTitle: { marginBottom: Spacing.sm },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.md,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  perkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  vehicleThumb: {
    width: 48,
    height: 32,
  },
  emptyVehicles: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  bookButton: {
    width: "100%",
  },
});
