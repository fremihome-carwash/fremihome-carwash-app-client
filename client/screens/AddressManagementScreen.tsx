import React, { useCallback, useState } from "react";
import { StyleSheet, View, Pressable, Alert, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
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
  SavedAddress,
  getSavedAddresses,
  deleteAddress,
} from "@/lib/storage";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function AddressManagementScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const addrs = await getSavedAddresses();
        setAddresses(addrs);
      };
      load();
    }, [])
  );

  const openAddAddress = () => {
    navigation.navigate("RegisterAddress", {
      onSaved: (addr) => setAddresses((prev) => [...prev, addr]),
    });
  };

  const handleRemoveAddress = (addressId: string, alias: string) => {
    Alert.alert(
      "Eliminar Dirección",
      `¿Eliminar "${alias}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await deleteAddress(addressId);
            setAddresses((prev) => prev.filter((a) => a.id !== addressId));
          },
        },
      ]
    );
  };

  const formatAddressLine = (addr: SavedAddress) => {
    let line = "";
    if (addr.coto) line += `${addr.coto}, `;
    line += `${addr.street} #${addr.exteriorNumber}`;
    if (addr.interiorNumber) line += ` Int. ${addr.interiorNumber}`;
    return line;
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
        {addresses.length > 0 ? (
          <Animated.View layout={Layout} style={styles.addressList}>
            {addresses.map((addr, index) => (
              <Animated.View
                key={addr.id}
                entering={FadeInDown.delay(index * 50).springify()}
                layout={Layout}
              >
                <View
                  style={[
                    styles.addressCard,
                    { backgroundColor: theme.backgroundDefault },
                  ]}
                >
                  <View style={[styles.addressIconContainer, { backgroundColor: (isDark ? Colors.accent : Colors.primary) + "15" }]}>
                    <Feather name="map-pin" size={20} color={isDark ? Colors.accent : Colors.primary} />
                  </View>
                  <View style={styles.addressInfo}>
                    <ThemedText type="h3" style={{ fontSize: 16 }}>
                      {addr.alias}
                    </ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      {formatAddressLine(addr)}
                    </ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      {addr.colony}, {addr.city}, {addr.state}
                    </ThemedText>
                    {addr.reference ? (
                      <ThemedText type="small" style={{ color: theme.textSecondary + "80" }}>
                        Ref: {addr.reference}
                      </ThemedText>
                    ) : null}
                  </View>
                  <Pressable
                    onPress={() => handleRemoveAddress(addr.id, addr.alias)}
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
            <Feather name="map-pin" size={40} color={theme.textSecondary + "60"} />
            <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.md }}>
              No tienes direcciones guardadas
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary + "80", textAlign: "center" }}>
              Agrega una dirección para el servicio a domicilio
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
  addressList: {
    gap: Spacing.md,
  },
  addressCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  addressIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  addressInfo: {
    flex: 1,
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
