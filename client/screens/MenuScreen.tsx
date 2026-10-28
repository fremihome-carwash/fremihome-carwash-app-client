import React, { useCallback, useState } from "react";
import { StyleSheet, View, ScrollView, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import {
  getUserData,
  getSavedAddresses,
  PACKAGES,
  UserData,
} from "@/lib/storage";
import { useAuth } from "@/lib/auth-context";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface MenuItemData {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  screen: keyof RootStackParamList;
}

export default function MenuScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme, isDark } = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { logout, user } = useAuth();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [addressCount, setAddressCount] = useState(0);

  const handleLogout = async () => {
    Haptics.selectionAsync();
    await logout();
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    const [u, addrs] = await Promise.all([getUserData(), getSavedAddresses()]);
    setUserData(u);
    setAddressCount(addrs.length);
  };

  const vehicleCount = userData?.vehicles?.length || 0;

  const getMembershipLabel = () => {
    if (!userData?.membership) return "Sin paquete activo";
    const pkg = PACKAGES.find((p) => p.id === userData.membership?.packageId);
    return pkg ? `${pkg.name} - ${userData.membership.washesRemaining} lavadas` : "Paquete activo";
  };

  const accentColor = isDark ? Colors.accent : Colors.primary;

  const menuItems: MenuItemData[] = [
    {
      icon: "user",
      title: "Mi Perfil",
      subtitle: "Nombre, teléfono, correo",
      screen: "Profile",
    },
    {
      icon: "map-pin",
      title: "Direcciones",
      subtitle:
        addressCount > 0
          ? `${addressCount} dirección${addressCount > 1 ? "es" : ""} guardada${addressCount > 1 ? "s" : ""}`
          : "Agregar dirección",
      screen: "AddressManagement",
    },
    {
      icon: "truck",
      title: "Mis Vehículos",
      subtitle:
        vehicleCount > 0
          ? `${vehicleCount} vehículo${vehicleCount > 1 ? "s" : ""} guardado${vehicleCount > 1 ? "s" : ""}`
          : "Agregar vehículos",
      screen: "VehicleManagement",
    },
    {
      icon: "award",
      title: "Mis Paquetes",
      subtitle: getMembershipLabel(),
      screen: "MembershipDetail",
    },
  ];

  const handleItemPress = (screen: keyof RootStackParamList) => {
    Haptics.selectionAsync();
    navigation.navigate(screen as any);
  };

  const cardSurface = {
    backgroundColor: theme.backgroundDefault,
    borderColor: theme.backgroundTertiary,
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Spacing.xl,
            paddingBottom: tabBarHeight + Spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.profileSection}>
          <View style={[styles.avatar, { backgroundColor: accentColor + "15" }]}>
            <Feather name="user" size={32} color={accentColor} />
          </View>
          <ThemedText type="h1">{userData?.name || user?.name || "Usuario"}</ThemedText>
          {(userData?.email || user?.email) ? (
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              {userData?.email || user?.email}
            </ThemedText>
          ) : null}
        </Animated.View>

        {/* Menu items card — same shape as cw_platf / cw_cmp */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={[styles.card, cardSurface]}>
          {menuItems.map((item, index) => {
            const isLast = index === menuItems.length - 1;
            return (
              <Pressable
                key={item.screen}
                onPress={() => handleItemPress(item.screen)}
                style={({ pressed }) => [
                  styles.menuItem,
                  !isLast && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: theme.backgroundTertiary,
                  },
                  pressed && { backgroundColor: theme.backgroundSecondary },
                ]}
              >
                <View style={[styles.menuItemIcon, { backgroundColor: theme.backgroundSecondary }]}>
                  <Feather name={item.icon} size={16} color={theme.textSecondary} />
                </View>
                <View style={styles.menuItemText}>
                  <ThemedText style={styles.menuItemTitle}>{item.title}</ThemedText>
                  <ThemedText style={[styles.menuItemSubtitle, { color: theme.textSecondary }]}>
                    {item.subtitle}
                  </ThemedText>
                </View>
                <Feather name="chevron-right" size={16} color={theme.textSecondary} />
              </Pressable>
            );
          })}
        </Animated.View>

        {/* Logout card — same shape, destructive variant */}
        <Animated.View entering={FadeInDown.delay(150).springify()} style={[styles.card, cardSurface]}>
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.menuItem,
              pressed && { backgroundColor: theme.backgroundSecondary },
            ]}
          >
            <View style={[styles.menuItemIcon, { backgroundColor: Colors.error + "1A" }]}>
              <Feather name="log-out" size={16} color={Colors.error} />
            </View>
            <ThemedText style={[styles.menuItemTitle, { color: Colors.error }]}>
              Cerrar sesión
            </ThemedText>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.footer}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Sparkle Clean v1.0.0
          </ThemedText>
        </Animated.View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.xl },
  profileSection: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
    gap: Spacing.xs,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  // ─── Shared card (matches cw_platf/more.tsx + cw_cmp/Profile.tsx) ───
  card: {
    borderRadius: BorderRadius.md, // 16 — same feel as `rounded-2xl` (16px)
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: Spacing.lg,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14, // match web `py-3.5`
    gap: Spacing.md,
  },
  menuItemIcon: {
    width: 36, // match web `w-9 h-9`
    height: 36,
    borderRadius: BorderRadius.sm, // 12 — match web `rounded-xl`
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemText: { flex: 1, gap: 2 },
  menuItemTitle: { fontSize: 14, fontWeight: "500" }, // match web `text-sm font-medium`
  menuItemSubtitle: { fontSize: 12 }, // match web `text-xs`
  footer: {
    alignItems: "center",
    paddingTop: Spacing.lg,
  },
});
