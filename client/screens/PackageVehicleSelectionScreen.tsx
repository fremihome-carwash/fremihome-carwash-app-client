import React, { useState, useCallback } from "react";
import { StyleSheet, View, ScrollView, Pressable } from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
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
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import {
  VehicleSize,
  UserData,
  getUserData,
  getActiveMemberships,
  getVehicleName,
} from "@/lib/storage";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const VEHICLE_OPTIONS: { size: VehicleSize; image: any; description: string }[] = [
  { size: "small", image: vehicleSmall, description: "Sedán, Hatchback, Coupé" },
  { size: "suv", image: vehicleSuv, description: "SUV, Crossover, Minivan" },
  { size: "large", image: vehicleLarge, description: "Camioneta, Pick-up, Van" },
];

export default function PackageVehicleSelectionScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [userData, setUserData] = useState<UserData | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    const data = await getUserData();
    setUserData(data);
  };

  const activeMemberships = userData ? getActiveMemberships(userData) : [];

  const handleSelectVehicle = (size: VehicleSize) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("Packages", { vehicleSize: size });
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

        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <ThemedText type="h2" style={styles.title}>
            Tipo de Vehículo
          </ThemedText>
          <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
            El precio del paquete depende del tipo de vehículo
          </ThemedText>
        </Animated.View>

        <View style={styles.vehicleList}>
          {VEHICLE_OPTIONS.map((option, index) => (
            <Animated.View
              key={option.size}
              entering={FadeInDown.delay(100 + index * 80).springify()}
            >
              <Card
                elevation={1}
                onPress={() => handleSelectVehicle(option.size)}
                style={styles.vehicleCard}
              >
                <Image
                  source={option.image}
                  style={styles.vehicleImage}
                  contentFit="contain"
                />
                <View style={styles.vehicleInfo}>
                  <ThemedText type="h3">{getVehicleName(option.size)}</ThemedText>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    {option.description}
                  </ThemedText>
                </View>
                <Feather
                  name="chevron-right"
                  size={22}
                  color={theme.textSecondary}
                />
              </Card>
            </Animated.View>
          ))}
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
  title: {
    marginBottom: Spacing.xs,
  },
  subtitle: {
    marginBottom: Spacing.xl,
  },
  vehicleList: {
    gap: Spacing.md,
  },
  vehicleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  vehicleImage: {
    width: 80,
    height: 55,
  },
  vehicleInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
});
