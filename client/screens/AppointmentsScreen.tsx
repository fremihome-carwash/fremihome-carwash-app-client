import React, { useCallback, useState } from "react";
import {
  StyleSheet,
  View,
  FlatList,
  Pressable,
  RefreshControl,
} from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import {
  getBookings,
  Booking,
  formatDate,
  formatPrice,
  getVehicleName,
  getWashTypeName,
} from "@/lib/storage";
import { getBookingDisplayStatus } from "@/lib/booking-status";

import emptyAppointments from "../../assets/images/empty-appointments.png";
import sparkleClean from "../../assets/images/sparkle-clean.png";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function AppointmentsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme, isDark } = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<"upcoming" | "history">("upcoming");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadBookings = useCallback(async () => {
    const data = await getBookings();
    setBookings(data);
    setIsLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBookings();
    }, [loadBookings])
  );

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadBookings();
    setIsRefreshing(false);
  }, [loadBookings]);

  const filteredBookings = bookings.filter((b) =>
    activeTab === "upcoming" ? b.status === "upcoming" : b.status !== "upcoming"
  );

  const handleBookingPress = (booking: Booking) => {
    navigation.navigate("AppointmentDetail", { booking });
  };

  const renderBooking = ({ item, index }: { item: Booking; index: number }) => {
    const display = getBookingDisplayStatus(item);
    return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <Card
        elevation={1}
        onPress={() => handleBookingPress(item)}
        style={styles.bookingCard}
      >
        <View style={styles.bookingHeader}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: display.color },
            ]}
          />
          <ThemedText
            type="caption"
            style={{ color: display.color }}
          >
            {display.label}
          </ThemedText>
        </View>
        <View style={styles.bookingInfo}>
          <ThemedText type="h3">
            {item.vehicleBrand ? `${item.vehicleBrand} ${item.vehicleModel}` : getVehicleName(item.vehicleSize)}
          </ThemedText>
        </View>
        <View style={styles.bookingDetailRows}>
          <View style={styles.bookingDetailRow}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>Tamaño</ThemedText>
            <ThemedText type="small" style={{ fontWeight: "600" }}>{getVehicleName(item.vehicleSize)}</ThemedText>
          </View>
          <View style={styles.bookingDetailRow}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>Lavado</ThemedText>
            <ThemedText type="small" style={{ fontWeight: "600" }}>{getWashTypeName(item.washType)}</ThemedText>
          </View>
          <View style={styles.bookingDetailRow}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>Fecha</ThemedText>
            <ThemedText type="small" style={{ fontWeight: "600" }}>{formatDate(item.date)}</ThemedText>
          </View>
          <View style={styles.bookingDetailRow}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>Hora</ThemedText>
            <ThemedText type="small" style={{ fontWeight: "600" }}>{item.time}</ThemedText>
          </View>
          <View style={styles.bookingDetailRow}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>Precio</ThemedText>
            {item.usedMembership ? (
              <ThemedText type="small" style={{ color: Colors.success, fontWeight: "600" }}>
                Paquete
              </ThemedText>
            ) : (
              <ThemedText type="small" style={{ color: isDark ? Colors.accent : Colors.primary, fontWeight: "600" }}>
                {formatPrice(item.totalPrice)}
              </ThemedText>
            )}
          </View>
        </View>
        <View style={styles.bookingFooter}>
          <Feather
            name="chevron-right"
            size={20}
            color={theme.textSecondary}
          />
        </View>
      </Card>
    </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Image
        source={activeTab === "upcoming" ? emptyAppointments : sparkleClean}
        style={styles.emptyImage}
        contentFit="contain"
      />
      <ThemedText type="h2" style={styles.emptyTitle}>
        {activeTab === "upcoming"
          ? "No tienes citas próximas"
          : "Sin historial aún"}
      </ThemedText>
      <ThemedText
        type="body"
        style={[styles.emptyText, { color: theme.textSecondary }]}
      >
        {activeTab === "upcoming"
          ? "Reserva un lavado y tu cita aparecerá aquí"
          : "Cuando completes un lavado, lo verás en tu historial"}
      </ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: Spacing.lg }]}>
        <ThemedText type="h1">Mis Citas</ThemedText>
      </View>

      <View style={styles.tabsContainer}>
        <Pressable
          onPress={() => setActiveTab("upcoming")}
          style={[
            styles.tab,
            activeTab === "upcoming" && {
              backgroundColor: isDark ? Colors.accent : Colors.primary,
            },
          ]}
        >
          <ThemedText
            type="caption"
            style={{
              color:
                activeTab === "upcoming"
                  ? "#FFFFFF"
                  : theme.textSecondary,
              fontWeight: "600",
            }}
          >
            Próximas
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("history")}
          style={[
            styles.tab,
            activeTab === "history" && {
              backgroundColor: isDark ? Colors.accent : Colors.primary,
            },
          ]}
        >
          <ThemedText
            type="caption"
            style={{
              color:
                activeTab === "history"
                  ? "#FFFFFF"
                  : theme.textSecondary,
              fontWeight: "600",
            }}
          >
            Historial
          </ThemedText>
        </Pressable>
      </View>

      <FlatList
        data={filteredBookings}
        renderItem={renderBooking}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + Spacing.xl },
          filteredBookings.length === 0 && styles.emptyList,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  tab: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
  },
  emptyList: {
    flex: 1,
  },
  bookingCard: {
    marginBottom: Spacing.md,
  },
  bookingHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  bookingInfo: {
    marginBottom: Spacing.sm,
  },
  bookingMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  metaIcon: {
    marginRight: Spacing.xs,
  },
  bookingDetailRows: {
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  bookingDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bookingFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing["3xl"],
  },
  emptyImage: {
    width: 150,
    height: 150,
    marginBottom: Spacing.xl,
    opacity: 0.8,
  },
  emptyTitle: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  emptyText: {
    textAlign: "center",
  },
});
