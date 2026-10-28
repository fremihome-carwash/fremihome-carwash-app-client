import React, { useCallback, useState } from "react";
import { StyleSheet, View, Pressable, Alert, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, Layout } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import {
  SavedVehicle,
  VehicleSize,
  getVehicleName,
  getSavedVehicles,
  deleteVehicle,
} from "@/lib/storage";

import vehicleSmall from "../../assets/images/vehicle-small.png";
import vehicleSuv from "../../assets/images/vehicle-suv.png";
import vehicleLarge from "../../assets/images/vehicle-large.png";

const VEHICLE_IMAGES: Record<VehicleSize, any> = {
  small: vehicleSmall,
  suv: vehicleSuv,
  large: vehicleLarge,
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function VehicleManagementScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();

  const [vehicles, setVehicles] = useState<SavedVehicle[]>([]);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const v = await getSavedVehicles();
        setVehicles(v);
      };
      load();
    }, [])
  );

  const openAddVehicle = () => {
    navigation.navigate("RegisterVehicle", {
      onSaved: (vehicle) => setVehicles((prev) => [...prev, vehicle]),
    });
  };

  const handleRemoveVehicle = (vehicleId: string, vehicleLabel: string) => {
    Alert.alert(
      "Eliminar Vehículo",
      `¿Eliminar "${vehicleLabel}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await deleteVehicle(vehicleId);
            setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
          },
        },
      ]
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
        {vehicles.length > 0 ? (
          <Animated.View layout={Layout} style={styles.vehiclesList}>
            {vehicles.map((vehicle, index) => (
              <Animated.View
                key={vehicle.id}
                entering={FadeInDown.delay(index * 50).springify()}
                layout={Layout}
              >
                <View
                  style={[
                    styles.vehicleCard,
                    { backgroundColor: theme.backgroundDefault },
                  ]}
                >
                  <Image
                    source={VEHICLE_IMAGES[vehicle.size]}
                    style={styles.vehicleImage}
                    contentFit="contain"
                  />
                  <View style={styles.vehicleInfo}>
                    <ThemedText type="h3" style={{ fontSize: 16 }}>
                      {vehicle.brand ? `${vehicle.brand} ${vehicle.model || ""} ${vehicle.color || ""}`.trim() : (vehicle as any).name || "Vehículo"}
                    </ThemedText>
                    <View style={styles.vehicleMeta}>
                      <ThemedText type="small" style={{ color: theme.textSecondary }}>
                        <ThemedText type="small" style={{ fontWeight: "700", color: theme.textSecondary }}>Tamaño:</ThemedText> {getVehicleName(vehicle.size)}
                      </ThemedText>
                      <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.md }}>
                        <ThemedText type="small" style={{ fontWeight: "700", color: theme.textSecondary }}>Placa:</ThemedText> {vehicle.plate || "—"}
                      </ThemedText>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => handleRemoveVehicle(vehicle.id, `${vehicle.brand} ${vehicle.model}`)}
                    style={styles.removeButton}
                  >
                    <Feather name="trash-2" size={18} color={Colors.error} />
                  </Pressable>
                </View>
              </Animated.View>
            ))}
          </Animated.View>
        ) : (
          <View style={[styles.emptyState, { backgroundColor: theme.backgroundDefault }]}>
            <Feather name="truck" size={40} color={theme.textSecondary + "60"} />
            <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.md }}>
              No tienes vehículos guardados
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary + "80", textAlign: "center" }}>
              Agrega un vehículo para reservar más rápido
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
    paddingTop: Spacing.xl,
  },
  vehiclesList: {
    gap: Spacing.md,
  },
  vehicleCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  vehicleImage: {
    width: 64,
    height: 48,
    marginRight: Spacing.lg,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: 4,
  },
  removeButton: {
    padding: Spacing.sm,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.xl * 2,
    borderRadius: BorderRadius.lg,
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
});
