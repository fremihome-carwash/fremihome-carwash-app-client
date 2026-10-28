import React, { useState, useCallback } from "react";
import { StyleSheet, View, Pressable, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useNavigation, useFocusEffect, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import {
  VehicleSize,
  SavedVehicle,
  SavedAddress,
  getSavedVehicles,
  getVehicleName,
  getSavedAddresses,
  getActiveMemberships,
  getIncludedServiceIds,
  getUserData,
} from "@/lib/storage";

import vehicleSmall from "../../assets/images/vehicle-small.png";
import vehicleSuv from "../../assets/images/vehicle-suv.png";
import vehicleLarge from "../../assets/images/vehicle-large.png";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "VehicleSelection">;
type RouteType = RouteProp<RootStackParamList, "VehicleSelection">;

const VEHICLE_IMAGES: Record<VehicleSize, any> = {
  small: vehicleSmall,
  suv: vehicleSuv,
  large: vehicleLarge,
};


export default function VehicleSelectionScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const incomingMembershipId = route.params?.membershipId;

  const [selectedSize, setSelectedSize] = useState<VehicleSize | null>(null);
  const [savedVehicles, setSavedVehicles] = useState<SavedVehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          const [vehicles, addresses] = await Promise.all([
            getSavedVehicles(),
            getSavedAddresses(),
          ]);
          setSavedVehicles(vehicles);
          setSavedAddresses(addresses);
          setSelectedVehicleId((prev) =>
            prev && vehicles.some((v) => v.id === prev) ? prev : null
          );
          setSelectedSize((prev) => {
            const match = vehicles.find((v) => v.id === selectedVehicleId);
            return match ? match.size : prev;
          });
          setSelectedAddressId((prev) =>
            prev && addresses.some((a) => a.id === prev) ? prev : null
          );
        } catch {}
      };
      load();
    }, [])
  );

  const handleSelectSaved = (vehicle: SavedVehicle) => {
    Haptics.selectionAsync();
    setSelectedVehicleId(vehicle.id);
    setSelectedSize(vehicle.size);
  };

  const handleSelectAddress = (address: SavedAddress) => {
    Haptics.selectionAsync();
    setSelectedAddressId(address.id);
  };

  const handleContinue = async () => {
    if (selectedSize && selectedVehicleId && selectedAddressId) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const addr = savedAddresses.find((a) => a.id === selectedAddressId);
      const addressLabel = addr
        ? `${addr.alias} - ${addr.coto ? `${addr.coto}, ` : ""}${addr.street} #${addr.exteriorNumber}${addr.interiorNumber ? ` Int. ${addr.interiorNumber}` : ""}, ${addr.colony}, ${addr.city}`
        : "";
      const vehicle = savedVehicles.find((v) => v.id === selectedVehicleId);
      const baseParams = {
        vehicleSize: selectedSize,
        addressLabel,
        vehicleBrand: vehicle?.brand || "",
        vehicleModel: vehicle?.model || "",
        vehicleColor: vehicle?.color || "",
        vehiclePlate: vehicle?.plate,
      };

      if (incomingMembershipId) {
        const userData = await getUserData();
        const actives = userData ? getActiveMemberships(userData) : [];
        const match = actives.find((a) => a.membership.id === incomingMembershipId);
        if (match) {
          const pkg = match.package;
          const addOns = getIncludedServiceIds(pkg.washType);
          navigation.navigate("ScheduleSelection", {
            ...baseParams,
            washType: pkg.washType,
            addOns,
            totalPrice: 0,
            membershipId: incomingMembershipId,
          });
          return;
        }
      }

      navigation.navigate("BookingPackageOption", baseParams);
    }
  };

  const openAddVehicle = () => {
    navigation.navigate("RegisterVehicle", {
      onSaved: (vehicle) => {
        setSavedVehicles((prev) => [...prev, vehicle]);
        setSelectedVehicleId(vehicle.id);
        setSelectedSize(vehicle.size);
      },
    });
  };

  const openAddAddress = () => {
    navigation.navigate("RegisterAddress", {
      onSaved: (addr) => {
        setSavedAddresses((prev) => [...prev, addr]);
        setSelectedAddressId(addr.id);
      },
    });
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <ThemedText type="h2" style={styles.sectionTitle}>
            Mis Vehículos
          </ThemedText>

          {savedVehicles.length > 0 ? (
            <View style={styles.optionsContainer}>
              {savedVehicles.map((vehicle, index) => {
                const isSelected = selectedVehicleId === vehicle.id;
                return (
                  <Animated.View
                    key={vehicle.id}
                    entering={FadeInDown.delay(100 + index * 50).springify()}
                  >
                    <Pressable
                      onPress={() => handleSelectSaved(vehicle)}
                      style={[
                        styles.optionCard,
                        {
                          backgroundColor: isSelected
                            ? isDark
                              ? "rgba(6, 182, 212, 0.15)"
                              : "rgba(30, 64, 175, 0.08)"
                            : theme.backgroundDefault,
                          borderColor: isSelected
                            ? isDark
                              ? Colors.accent
                              : Colors.primary
                            : "transparent",
                        },
                      ]}
                    >
                      <Image
                        source={VEHICLE_IMAGES[vehicle.size]}
                        style={styles.vehicleImage}
                        contentFit="contain"
                      />
                      <View style={styles.optionInfo}>
                        <ThemedText type="h3">{vehicle.brand} {vehicle.model} {vehicle.color}</ThemedText>
                        <View style={styles.vehicleMeta}>
                          <ThemedText type="small" style={{ color: theme.textSecondary }}>
                            <ThemedText type="small" style={{ fontWeight: "700", color: theme.textSecondary }}>Tamaño:</ThemedText> {getVehicleName(vehicle.size)}
                          </ThemedText>
                          <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.md }}>
                            <ThemedText type="small" style={{ fontWeight: "700", color: theme.textSecondary }}>Placa:</ThemedText> {vehicle.plate || "—"}
                          </ThemedText>
                        </View>
                      </View>
                      <Feather
                        name={isSelected ? "check-circle" : "chevron-right"}
                        size={20}
                        color={isSelected ? (isDark ? Colors.accent : Colors.primary) : theme.textSecondary}
                      />
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          ) : (
            <View style={[styles.emptyState, { backgroundColor: theme.backgroundDefault }]}>
              <Feather name="truck" size={40} color={theme.textSecondary + "60"} />
              <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.md }}>
                No tienes vehículos registrados
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary + "80", textAlign: "center" }}>
                Registra tu vehículo para comenzar
              </ThemedText>
            </View>
          )}

          <Pressable
            onPress={openAddVehicle}
            style={[styles.addButton, { borderColor: theme.backgroundTertiary }]}
          >
            <Feather name="plus" size={18} color={isDark ? Colors.accent : Colors.primary} />
            <ThemedText type="body" style={{ color: isDark ? Colors.accent : Colors.primary, fontWeight: "600" }}>
              Agregar Vehículo
            </ThemedText>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).springify()} style={{ marginTop: Spacing.xl }}>
          <ThemedText type="h2" style={styles.sectionTitle}>
            Dirección del Servicio
          </ThemedText>

          {savedAddresses.length > 0 ? (
            <View style={styles.optionsContainer}>
              {savedAddresses.map((addr, index) => {
                const isSelected = selectedAddressId === addr.id;
                return (
                  <Animated.View
                    key={addr.id}
                    entering={FadeInDown.delay(200 + index * 50).springify()}
                  >
                    <Pressable
                      onPress={() => handleSelectAddress(addr)}
                      style={[
                        styles.optionCard,
                        {
                          backgroundColor: isSelected
                            ? isDark
                              ? "rgba(6, 182, 212, 0.15)"
                              : "rgba(30, 64, 175, 0.08)"
                            : theme.backgroundDefault,
                          borderColor: isSelected
                            ? isDark
                              ? Colors.accent
                              : Colors.primary
                            : "transparent",
                        },
                      ]}
                    >
                      <View style={[styles.addressIcon, { backgroundColor: (isDark ? Colors.accent : Colors.primary) + "15" }]}>
                        <Feather name="map-pin" size={20} color={isDark ? Colors.accent : Colors.primary} />
                      </View>
                      <View style={styles.optionInfo}>
                        <ThemedText type="h3">{addr.alias}</ThemedText>
                        <ThemedText type="small" style={{ color: theme.textSecondary }}>
                          {addr.coto ? `${addr.coto}, ` : ""}{addr.street} #{addr.exteriorNumber}{addr.interiorNumber ? ` Int. ${addr.interiorNumber}` : ""}
                        </ThemedText>
                        <ThemedText type="small" style={{ color: theme.textSecondary }}>
                          {addr.colony}, {addr.city}
                          {addr.reference ? ` - ${addr.reference}` : ""}
                        </ThemedText>
                      </View>
                      <Feather
                        name={isSelected ? "check-circle" : "chevron-right"}
                        size={20}
                        color={isSelected ? (isDark ? Colors.accent : Colors.primary) : theme.textSecondary}
                      />
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          ) : (
            <View style={[styles.emptyState, { backgroundColor: theme.backgroundDefault }]}>
              <Feather name="map-pin" size={40} color={theme.textSecondary + "60"} />
              <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.md }}>
                No tienes direcciones registradas
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary + "80", textAlign: "center" }}>
                Agrega una dirección para el servicio
              </ThemedText>
            </View>
          )}

          <Pressable
            onPress={openAddAddress}
            style={[styles.addButton, { borderColor: theme.backgroundTertiary }]}
          >
            <Feather name="plus" size={18} color={isDark ? Colors.accent : Colors.primary} />
            <ThemedText type="body" style={{ color: isDark ? Colors.accent : Colors.primary, fontWeight: "600" }}>
              Agregar Dirección
            </ThemedText>
          </Pressable>
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <Button
          onPress={handleContinue}
          disabled={!selectedVehicleId || !selectedAddressId}
          style={styles.continueButton}
        >
          Continuar
        </Button>
      </View>

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
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  optionsContainer: {
    gap: Spacing.md,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
  },
  vehicleImage: {
    width: 64,
    height: 48,
    marginRight: Spacing.lg,
  },
  optionInfo: {
    flex: 1,
  },
  vehicleMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: 4,
  },
  addressIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.xl * 2,
    borderRadius: BorderRadius.lg,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  continueButton: {
    backgroundColor: Colors.primary,
  },
});
