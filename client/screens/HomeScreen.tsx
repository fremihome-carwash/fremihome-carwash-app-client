import React, { useCallback, useState } from "react";
import {
  StyleSheet,
  ScrollView,
  FlatList,
  View,
  RefreshControl,
} from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
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
  getBookings,
  getUserData,
  getActiveMembership,
  PACKAGES,
  Booking,
  UserData,
  formatDate,
  formatPrice,
  getVehicleName,
  getWashTypeName,
} from "@/lib/storage";
import { getBookingDisplayStatus } from "@/lib/booking-status";

const subscriptionBadge = require("../../assets/images/subscription-badge.png");

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme, isDark } = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    const [user, bookings] = await Promise.all([getUserData(), getBookings()]);
    setUserData(user);
    setRecentBookings(
      bookings
        .filter(
          (b) =>
            b.status === "upcoming" ||
            (b.status === "cancelled" && b.cancelledBy === "company"),
        )
        .slice(0, 3),
    );
    setIsLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  }, [loadData]);

  const handleBookPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("VehicleSelection");
  };

  const handleBookingPress = (booking: Booking) => {
    navigation.navigate("AppointmentDetail", { booking });
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <Animated.View
          entering={FadeInDown.delay(100)}
          style={[styles.skeleton, { backgroundColor: theme.backgroundSecondary }]}
        />
        <Animated.View
          entering={FadeInDown.delay(200)}
          style={[
            styles.skeleton,
            styles.skeletonLarge,
            { backgroundColor: theme.backgroundSecondary },
          ]}
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Spacing.lg, paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >

        {userData?.membership ? (
          (() => {
            const activeMembership = getActiveMembership(userData);
            if (!activeMembership) return null;
            const { package: pkg, membership } = activeMembership;
            const duration = pkg.durations.find((d) => d.id === membership.durationId);
            const totalWashes = duration ? duration.washesIncluded : membership.washesRemaining;
            const washesUsed = totalWashes - membership.washesRemaining;
            const progressPercent = (membership.washesRemaining / totalWashes) * 100;
            
            return (
              <Animated.View entering={FadeInDown.delay(100).springify()}>
                <Card
                  elevation={2}
                  onPress={() => (navigation as any).navigate("PackagesTab")}
                  style={StyleSheet.flatten([
                    styles.membershipCard,
                    { backgroundColor: isDark ? `${pkg.color}30` : `${pkg.color}15`, borderColor: pkg.color, borderWidth: 2 },
                  ])}
                >
                  <View style={styles.membershipHeader}>
                    <View style={[styles.membershipIconContainer, { backgroundColor: `${pkg.color}30` }]}>
                      <Feather
                        name={pkg.id === "premium" ? "award" : pkg.id === "completo" ? "star" : "check-circle"}
                        size={28}
                        color={pkg.color}
                      />
                    </View>
                    <View style={styles.membershipInfo}>
                      <ThemedText type="h3" style={{ color: pkg.color }}>
                        {pkg.name}
                      </ThemedText>
                      <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                        Paquete activo
                      </ThemedText>
                    </View>
                    <Feather name="chevron-right" size={20} color={theme.textSecondary} />
                  </View>
                  
                  <View style={styles.washesContainer}>
                    <View style={styles.washesTextRow}>
                      <Feather name="droplet" size={18} color={pkg.color} />
                      <ThemedText type="h2" style={{ color: pkg.color, marginLeft: Spacing.xs }}>
                        {membership.washesRemaining}
                      </ThemedText>
                      <ThemedText type="body" style={{ color: theme.textSecondary }}>
                        {" "}de {totalWashes} lavadas
                      </ThemedText>
                    </View>
                    <View style={[styles.progressBarBg, { backgroundColor: theme.backgroundTertiary }]}>
                      <View 
                        style={[
                          styles.progressBarFill, 
                          { width: `${progressPercent}%`, backgroundColor: pkg.color }
                        ]} 
                      />
                    </View>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      {washesUsed} usadas este mes
                    </ThemedText>
                  </View>
                </Card>
              </Animated.View>
            );
          })()
        ) : null}

        <Animated.View
          entering={FadeInDown.delay(150).springify()}
          style={styles.bookSection}
        >
          <Button onPress={handleBookPress} style={styles.bookButton}>
            Reservar Lavado
          </Button>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(200).springify()}
          style={styles.section}
        >
          <ThemedText type="h2" style={styles.sectionTitle}>
            Próximas Citas
          </ThemedText>

          {recentBookings.length > 0 ? (
            recentBookings.map((booking, index) => {
              const display = getBookingDisplayStatus(booking);
              return (
              <Animated.View
                key={booking.id}
                entering={FadeInDown.delay(250 + index * 50).springify()}
              >
                <Card
                  elevation={1}
                  onPress={() => handleBookingPress(booking)}
                  style={styles.bookingCard}
                >
                  <View style={styles.bookingHeader}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: display.color },
                      ]}
                    />
                    <ThemedText type="caption" style={{ color: display.color }}>
                      {display.label}
                    </ThemedText>
                  </View>
                  <View style={styles.bookingInfo}>
                    <ThemedText type="h3">
                      {booking.vehicleBrand ? `${booking.vehicleBrand} ${booking.vehicleModel}` : getVehicleName(booking.vehicleSize)}
                    </ThemedText>
                  </View>
                  <View style={styles.bookingDetailRows}>
                    <View style={styles.bookingDetailRow}>
                      <ThemedText type="small" style={{ color: theme.textSecondary }}>Tamaño</ThemedText>
                      <ThemedText type="small" style={{ fontWeight: "600" }}>{getVehicleName(booking.vehicleSize)}</ThemedText>
                    </View>
                    <View style={styles.bookingDetailRow}>
                      <ThemedText type="small" style={{ color: theme.textSecondary }}>Lavado</ThemedText>
                      <ThemedText type="small" style={{ fontWeight: "600" }}>{getWashTypeName(booking.washType)}</ThemedText>
                    </View>
                    <View style={styles.bookingDetailRow}>
                      <ThemedText type="small" style={{ color: theme.textSecondary }}>Fecha</ThemedText>
                      <ThemedText type="small" style={{ fontWeight: "600" }}>{formatDate(booking.date)}</ThemedText>
                    </View>
                    <View style={styles.bookingDetailRow}>
                      <ThemedText type="small" style={{ color: theme.textSecondary }}>Hora</ThemedText>
                      <ThemedText type="small" style={{ fontWeight: "600" }}>{booking.time}</ThemedText>
                    </View>
                  </View>
                  <View style={styles.bookingFooter}>
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
                    <Feather
                      name="chevron-right"
                      size={20}
                      color={theme.textSecondary}
                    />
                  </View>
                </Card>
              </Animated.View>
              );
            })
          ) : (
            <Card elevation={1} style={styles.emptyCard}>
              <Feather
                name="calendar"
                size={32}
                color={theme.textSecondary}
                style={styles.emptyIcon}
              />
              <ThemedText
                type="body"
                style={[styles.emptyText, { color: theme.textSecondary }]}
              >
                No tienes citas próximas
              </ThemedText>
              <ThemedText
                type="caption"
                style={{ color: theme.textSecondary, textAlign: "center" }}
              >
                Reserva tu primer lavado y mantén tu auto impecable
              </ThemedText>
            </Card>
          )}
        </Animated.View>
      </ScrollView>

    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    padding: Spacing.xl,
    paddingTop: 100,
    gap: Spacing.lg,
  },
  skeleton: {
    height: 80,
    borderRadius: BorderRadius.lg,
  },
  skeletonLarge: {
    height: 200,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
  },
  subscriptionCard: {
    marginBottom: Spacing.lg,
  },
  subscriptionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  subscriptionBadge: {
    width: 48,
    height: 48,
    marginRight: Spacing.lg,
  },
  subscriptionInfo: {
    flex: 1,
  },
  promoCard: {
    marginBottom: Spacing.lg,
  },
  carouselContent: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
    marginBottom: Spacing.md,
  },
  carouselCard: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  carouselRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  carouselIconCircle: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  carouselTextCol: {
    gap: 1,
  },
  bookSection: {
    marginBottom: Spacing["2xl"],
  },
  bookButton: {
    backgroundColor: Colors.primary,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
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
    marginBottom: Spacing.md,
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
    justifyContent: "space-between",
    alignItems: "center",
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
  },
  emptyIcon: {
    marginBottom: Spacing.md,
  },
  emptyText: {
    marginBottom: Spacing.xs,
  },
  membershipCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  membershipHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  membershipIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  membershipInfo: {
    flex: 1,
  },
  washesContainer: {
    gap: Spacing.sm,
  },
  washesTextRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressBarBg: {
    height: 8,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: BorderRadius.full,
  },
});
