import React, { useCallback, useState } from "react";
import { StyleSheet, View, ScrollView, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";

import vehicleSmall from "../../assets/images/vehicle-small.png";
import vehicleSuv from "../../assets/images/vehicle-suv.png";
import vehicleLarge from "../../assets/images/vehicle-large.png";
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
import {
  getUserData,
  UserData,
  PACKAGES,
  getActiveMemberships,
  getVehicleName,
} from "@/lib/storage";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type MembershipNavigationProp = NativeStackNavigationProp<RootStackParamList, "MembershipDetail">;

export default function MembershipDetailScreen() {
  const navigation = useNavigation<MembershipNavigationProp>();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedPerks, setExpandedPerks] = useState<Record<string, boolean>>({});

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


  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.skeleton, { backgroundColor: theme.backgroundSecondary }]} />
      </ThemedView>
    );
  }

  const activeMemberships = userData ? getActiveMemberships(userData) : [];

  if (activeMemberships.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}>
          <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.emptyState}>
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: isDark ? Colors.accent + "20" : Colors.primary + "15" },
              ]}
            >
              <Feather
                name="award"
                size={48}
                color={isDark ? Colors.accent : Colors.primary}
              />
            </View>
            <ThemedText type="h2" style={styles.emptyTitle}>
              Sin Paquetes Activos
            </ThemedText>
            <ThemedText
              type="body"
              style={[styles.emptyText, { color: theme.textSecondary }]}
            >
              Aún no tienes paquetes activos. Adquiere uno para disfrutar de
              lavadas y beneficios exclusivos.
            </ThemedText>
            <Button
              onPress={() => navigation.navigate("PackageVehicleSelection")}
              style={styles.activateButton}
            >
              Ver Paquetes Disponibles
            </Button>
          </Animated.View>
        </View>
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
        <ThemedText type="h3" style={styles.sectionHeader}>
          Paquetes Comprados ({activeMemberships.length})
        </ThemedText>

        {activeMemberships.map(({ package: pkg, membership, daysRemaining }, index) => {
          const duration = pkg.durations.find((d) => d.id === membership.durationId);
          const totalWashes = duration ? duration.washesIncluded : membership.washesRemaining;
          const progressPercent = (membership.washesRemaining / totalWashes) * 100;

          const allPerks = [
            ...pkg.perks,
            `${totalWashes} lavadas en ${duration ? duration.label.toLowerCase() : "tu plan"}`,
          ];
          const MAX_VISIBLE = 3;
          const isExpanded = !!expandedPerks[membership.id];
          const visiblePerks = isExpanded ? allPerks : allPerks.slice(0, MAX_VISIBLE);
          const hasMore = allPerks.length > MAX_VISIBLE;
          const hiddenCount = allPerks.length - MAX_VISIBLE;

          return (
            <Animated.View
              key={membership.id}
              entering={FadeInDown.delay(index * 100).springify()}
            >
              <Card
                elevation={2}
                style={styles.packageCard}
              >
                <View style={[styles.vehicleBanner, { backgroundColor: `${pkg.color}10` }]}>
                  <Image
                    source={membership.vehicleSize === "small" ? vehicleSmall : membership.vehicleSize === "suv" ? vehicleSuv : vehicleLarge}
                    style={styles.vehicleBannerImage}
                    contentFit="contain"
                  />
                  <ThemedText type="h3">
                    {getVehicleName(membership.vehicleSize)}
                  </ThemedText>
                </View>

                <View style={styles.packageHeader}>
                  <View
                    style={[styles.packageIcon, { backgroundColor: `${pkg.color}20` }]}
                  >
                    <Feather
                      name={pkg.id === "premium" ? "award" : pkg.id === "completo" ? "star" : "check-circle"}
                      size={24}
                      color={pkg.color}
                    />
                  </View>
                  <View style={styles.packageTitleContainer}>
                    <ThemedText type="h2">{pkg.name}</ThemedText>
                    <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                      {pkg.description}
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.durationBadge}>
                  <View style={[styles.durationTag, { backgroundColor: pkg.color + "20", borderColor: pkg.color }]}>
                    <ThemedText type="caption" style={{ fontWeight: "700", color: pkg.color }}>
                      {duration ? duration.label : "Activo"}
                    </ThemedText>
                    <ThemedText type="caption" style={{ color: pkg.color, fontSize: 11 }}>
                      {membership.washesRemaining}/{totalWashes} lavadas
                    </ThemedText>
                  </View>
                  <View style={styles.metaInfo}>
                    <View style={styles.metaRow}>
                      <Feather name="clock" size={13} color={theme.textSecondary} />
                      <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                        {daysRemaining} {daysRemaining === 1 ? "día" : "días"} restantes
                      </ThemedText>
                    </View>
                    <View style={styles.metaRow}>
                      <Feather name="calendar" size={13} color={theme.textSecondary} />
                      <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                        Vence: {new Date(membership.expirationDate).toLocaleDateString("es-MX", {
                          day: "numeric",
                          month: "short",
                        })}
                      </ThemedText>
                    </View>
                  </View>
                </View>

                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBar, { backgroundColor: pkg.color + "20" }]}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${progressPercent}%`, backgroundColor: pkg.color },
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.perksContainer}>
                  {visiblePerks.map((perk, perkIndex) => (
                    <View key={perkIndex} style={styles.perkRow}>
                      <Feather name="check-circle" size={16} color={Colors.success} />
                      <ThemedText type="body" style={styles.perkText}>
                        {perk}
                      </ThemedText>
                    </View>
                  ))}
                  {hasMore ? (
                    <Pressable
                      onPress={() =>
                        setExpandedPerks((prev) => ({
                          ...prev,
                          [membership.id]: !prev[membership.id],
                        }))
                      }
                      style={styles.seeMoreRow}
                    >
                      <Feather
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={16}
                        color={Colors.primary}
                      />
                      <ThemedText type="body" style={{ color: Colors.primary, fontWeight: "600" }}>
                        {isExpanded ? "Ver menos" : `Ver más (${hiddenCount})`}
                      </ThemedText>
                    </Pressable>
                  ) : null}
                </View>

                <Button
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    navigation.navigate("MembershipPackageDetail", { membershipId: membership.id });
                  }}
                  style={[styles.bookButton, { backgroundColor: pkg.color }]}
                >
                  Ver Detalle
                </Button>
              </Card>
            </Animated.View>
          );
        })}

        <Animated.View entering={FadeInDown.delay(activeMemberships.length * 100 + 50).springify()}>
          <Button
            onPress={() => navigation.navigate("PackageVehicleSelection")}
            style={[styles.addMoreButton, { backgroundColor: theme.backgroundSecondary }]}
            textColor={isDark ? Colors.accent : Colors.primary}
          >
            Comprar Otro Paquete
          </Button>
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
  content: {
    flex: 1,
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
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  emptyText: {
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  activateButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing["2xl"],
  },
  sectionHeader: {
    marginBottom: Spacing.sm,
  },
  packageCard: {
    paddingTop: 0,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    overflow: "hidden",
  },
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
  packageTitleContainer: {
    flex: 1,
    gap: Spacing.xs,
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
  vehicleBannerImage: {
    width: 80,
    height: 48,
  },
  durationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  durationTag: {
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    gap: 2,
  },
  metaInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  progressBarContainer: {
    marginBottom: Spacing.lg,
  },
  progressBar: {
    width: "100%",
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  perksContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  perkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  perkText: {
    flex: 1,
  },
  seeMoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  bookButton: {
    marginTop: Spacing.xs,
  },
  addMoreButton: {
    marginTop: Spacing.sm,
  },
});
