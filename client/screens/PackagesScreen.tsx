import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useFocusEffect, useRoute, RouteProp } from "@react-navigation/native";
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
  PACKAGES,
  Package,
  PackageDuration,
  UserData,
  getUserData,
  getActiveMemberships,
  formatPrice,
} from "@/lib/storage";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, "Packages">;

const MAX_VISIBLE_PERKS = 3;

function PerksSection({
  pkg,
  selectedDuration,
  expanded,
  onToggle,
  theme,
}: {
  pkg: Package;
  selectedDuration: PackageDuration;
  expanded: boolean;
  onToggle: () => void;
  theme: any;
}) {
  const allPerks = [
    ...pkg.perks,
    `${selectedDuration.washesIncluded} lavadas en ${selectedDuration.label.toLowerCase()}`,
  ];
  const hasMore = allPerks.length > MAX_VISIBLE_PERKS;
  const visiblePerks = expanded ? allPerks : allPerks.slice(0, MAX_VISIBLE_PERKS);
  const hiddenCount = allPerks.length - MAX_VISIBLE_PERKS;

  return (
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
        <Pressable onPress={onToggle} style={styles.seeMoreRow}>
          <Feather
            name={expanded ? "chevron-up" : "chevron-down"}
            size={16}
            color={Colors.primary}
          />
          <ThemedText type="body" style={{ color: Colors.primary, fontWeight: "600" }}>
            {expanded ? "Ver menos" : `Ver más (${hiddenCount})`}
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function PackagesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const { vehicleSize } = route.params;
  const [userData, setUserData] = useState<UserData | null>(null);
  const [selectedDurations, setSelectedDurations] = useState<Record<string, string>>({});
  const [expandedPerks, setExpandedPerks] = useState<Record<string, boolean>>({});

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    const data = await getUserData();
    setUserData(data);
  };

  const handleSelectDuration = (pkgId: string, durationId: string) => {
    Haptics.selectionAsync();
    setSelectedDurations((prev) => ({ ...prev, [pkgId]: durationId }));
  };

  const handleBuyPackage = (pkg: Package) => {
    const durationId = selectedDurations[pkg.id] || pkg.durations[0].id;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("PackagePurchase", {
      packageId: pkg.id,
      durationId,
      vehicleSize,
    });
  };

  const activeMemberships = userData ? getActiveMemberships(userData) : [];

  const getSelectedDuration = (pkg: Package): PackageDuration => {
    const durationId = selectedDurations[pkg.id] || pkg.durations[0].id;
    return pkg.durations.find((d) => d.id === durationId) || pkg.durations[0];
  };

  const getPrice = (pkg: Package): number => {
    const duration = getSelectedDuration(pkg);
    return duration.prices[vehicleSize];
  };

  const renderPackageCard = (pkg: Package, index: number) => {
    const selectedDuration = getSelectedDuration(pkg);
    const price = getPrice(pkg);

    return (
      <Animated.View
        key={pkg.id}
        entering={FadeInDown.delay(index * 100).springify()}
      >
        <Card
          elevation={pkg.popular ? 2 : 1}
          style={StyleSheet.flatten([
            styles.packageCard,
            pkg.popular ? styles.popularCard : undefined,
          ])}
        >
          {pkg.popular ? (
            <View style={[styles.popularBadge, { backgroundColor: pkg.color }]}>
              <ThemedText type="caption" style={{ color: "#FFFFFF", fontWeight: "600" }}>
                Más Popular
              </ThemedText>
            </View>
          ) : null}

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

          <View style={styles.durationSelector}>
            {pkg.durations.map((dur) => {
              const isSelected = selectedDuration.id === dur.id;
              return (
                <Pressable
                  key={dur.id}
                  onPress={() => handleSelectDuration(pkg.id, dur.id)}
                  style={[
                    styles.durationOption,
                    {
                      backgroundColor: isSelected
                        ? pkg.color + "20"
                        : theme.backgroundSecondary,
                      borderColor: isSelected ? pkg.color : theme.backgroundTertiary,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                >
                  <ThemedText
                    type="caption"
                    style={{
                      fontWeight: isSelected ? "700" : "500",
                      color: isSelected ? pkg.color : theme.text,
                    }}
                  >
                    {dur.label}
                  </ThemedText>
                  <ThemedText
                    type="caption"
                    style={{ color: isSelected ? pkg.color : theme.textSecondary, fontSize: 11 }}
                  >
                    {dur.washesIncluded} lavadas
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.priceContainer}>
            <ThemedText type="display" style={{ color: pkg.color }}>
              {formatPrice(price)}
            </ThemedText>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              / {selectedDuration.label.toLowerCase()}
            </ThemedText>
          </View>

          <PerksSection
            pkg={pkg}
            selectedDuration={selectedDuration}
            expanded={!!expandedPerks[pkg.id]}
            onToggle={() =>
              setExpandedPerks((prev) => ({ ...prev, [pkg.id]: !prev[pkg.id] }))
            }
            theme={theme}
          />

          <Button
            onPress={() => handleBuyPackage(pkg)}
            style={[styles.activateButton, { backgroundColor: pkg.color }]}
          >
            Comprar Paquete
          </Button>
        </Card>
      </Animated.View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {activeMemberships.length > 0 ? (
          <Pressable
            style={[styles.activeMembershipBanner, { backgroundColor: isDark ? Colors.accent + "20" : Colors.primary + "15" }]}
            onPress={() => navigation.navigate("MembershipDetail")}
          >
            <Feather
              name="package"
              size={20}
              color={isDark ? Colors.accent : Colors.primary}
            />
            <ThemedText type="body" style={{ flex: 1, fontWeight: "500" }}>
              Tienes {activeMemberships.length} {activeMemberships.length === 1 ? "paquete activo" : "paquetes activos"}
            </ThemedText>
            <Feather
              name="chevron-right"
              size={20}
              color={isDark ? Colors.accent : Colors.primary}
            />
          </Pressable>
        ) : null}

        <View style={styles.packagesContainer}>
          {PACKAGES.map((pkg, index) => renderPackageCard(pkg, index))}
        </View>
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
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  activeMembershipBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  packagesContainer: {
    gap: Spacing.lg,
  },
  packageCard: {
    padding: Spacing.xl,
    overflow: "hidden",
  },
  popularCard: {
    borderWidth: 0,
  },
  popularBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderBottomLeftRadius: BorderRadius.md,
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
  durationSelector: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  durationOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.md,
    gap: 2,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
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
  activateButton: {
    marginTop: Spacing.xs,
  },
});
