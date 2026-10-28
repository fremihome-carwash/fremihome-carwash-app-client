import React, { useCallback, useState } from "react";
import { StyleSheet, ScrollView, View, RefreshControl } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import {
  Booking,
  getBookings,
  formatPrice,
  getVehicleName,
  getWashTypeName,
  ADD_ONS,
} from "@/lib/storage";

export default function HistoryScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const [completedBookings, setCompletedBookings] = useState<Booking[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadBookings = useCallback(async () => {
    const all = await getBookings();
    const completed = all.filter((b) => b.status === "completed");
    completed.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setCompletedBookings(completed);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBookings();
    }, [loadBookings])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  }, [loadBookings]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getAddOnNames = (addOnIds: string[]) => {
    return addOnIds
      .map((id) => ADD_ONS.find((a) => a.id === id)?.name)
      .filter(Boolean)
      .join(", ");
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: Spacing.lg,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        <ThemedText type="h1" style={styles.title}>
          Historial
        </ThemedText>
        <ThemedText
          type="body"
          style={[styles.subtitle, { color: theme.textSecondary }]}
        >
          Tus lavadas completadas
        </ThemedText>

        {completedBookings.length === 0 ? (
          <Animated.View
            entering={FadeInDown.springify()}
            style={styles.emptyContainer}
          >
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: theme.backgroundTertiary },
              ]}
            >
              <Feather
                name="clock"
                size={48}
                color={isDark ? Colors.accent : Colors.primary}
              />
            </View>
            <ThemedText type="h3" style={styles.emptyTitle}>
              Sin historial
            </ThemedText>
            <ThemedText
              type="body"
              style={[styles.emptyText, { color: theme.textSecondary }]}
            >
              Aquí aparecerán tus lavadas completadas
            </ThemedText>
          </Animated.View>
        ) : (
          completedBookings.map((booking, index) => (
            <Animated.View
              key={booking.id}
              entering={FadeInDown.delay(index * 50).springify()}
            >
              <Card elevation={1} style={styles.bookingCard}>
                <View style={styles.bookingHeader}>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: Colors.success + "20" },
                    ]}
                  >
                    <Feather
                      name="check-circle"
                      size={14}
                      color={Colors.success}
                    />
                    <ThemedText
                      type="caption"
                      style={{ color: Colors.success, marginLeft: 4 }}
                    >
                      Completada
                    </ThemedText>
                  </View>
                  {booking.usedMembership ? (
                    <ThemedText
                      type="caption"
                      style={{ color: Colors.success, fontWeight: "600" }}
                    >
                      Paquete
                    </ThemedText>
                  ) : (
                    <ThemedText
                      type="h3"
                      style={{ color: isDark ? Colors.accent : Colors.primary }}
                    >
                      {formatPrice(booking.totalPrice)}
                    </ThemedText>
                  )}
                </View>

                <View style={styles.bookingDetails}>
                  <View style={styles.detailRow}>
                    <Feather
                      name="calendar"
                      size={16}
                      color={theme.textSecondary}
                    />
                    <ThemedText
                      type="body"
                      style={[styles.detailText, { color: theme.textSecondary }]}
                    >
                      {formatDate(booking.date)}
                    </ThemedText>
                  </View>
                  <View style={styles.detailRow}>
                    <Feather
                      name="truck"
                      size={16}
                      color={theme.textSecondary}
                    />
                    <ThemedText
                      type="body"
                      style={[styles.detailText, { color: theme.textSecondary }]}
                    >
                      {getVehicleName(booking.vehicleSize)} -{" "}
                      {getWashTypeName(booking.washType)}
                    </ThemedText>
                  </View>
                  {booking.addOns.length > 0 ? (
                    <View style={styles.detailRow}>
                      <Feather
                        name="plus-circle"
                        size={16}
                        color={theme.textSecondary}
                      />
                      <ThemedText
                        type="caption"
                        style={[
                          styles.detailText,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {getAddOnNames(booking.addOns)}
                      </ThemedText>
                    </View>
                  ) : null}
                </View>
              </Card>
            </Animated.View>
          ))
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  subtitle: {
    marginBottom: Spacing.xl,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing["5xl"],
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  emptyText: {
    textAlign: "center",
  },
  bookingCard: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  bookingDetails: {
    gap: Spacing.sm,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  detailText: {
    flex: 1,
  },
});
