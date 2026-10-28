import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { StyleSheet, View, Pressable, ScrollView, Alert } from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";

import vehicleSmall from "../../assets/images/vehicle-small.png";
import vehicleSuv from "../../assets/images/vehicle-suv.png";
import vehicleLarge from "../../assets/images/vehicle-large.png";
import { useNavigation, useRoute, RouteProp, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { PaymentMethodSelector, PaymentMethodOption } from "@/components/PaymentMethodSelector";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import {
  saveBooking,
  useMembershipWash,
  generateId,
  formatPrice,
  formatDate,
  getVehicleName,
  getWashTypeName,
  getWashTypePriceForSize,
  VEHICLE_PRICES,
  WASH_TYPE_PRICES,
  ADD_ONS,
  ALL_SERVICES,
  PACKAGES,
  Booking,
  getUserData,
  UserData,
  getActiveMemberships,
  fetchCompanyPaymentMethods,
} from "@/lib/storage";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, "Payment">;


export default function PaymentScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const { vehicleSize, washType, addOns, date, time, totalPrice, reservationExpiry, addressLabel, vehicleBrand, vehicleModel, vehicleColor, vehiclePlate, comments, membershipId: preselectedMembershipId, companyId, companyName } = route.params;

  const VEHICLE_IMAGES: Record<string, any> = {
    small: vehicleSmall,
    suv: vehicleSuv,
    large: vehicleLarge,
  };

  const [secondsLeft, setSecondsLeft] = useState(() => {
    if (!reservationExpiry) return 0;
    return Math.max(0, Math.ceil((reservationExpiry - Date.now()) / 1000));
  });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasExpiredRef = useRef(false);

  useEffect(() => {
    if (!reservationExpiry) return;
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((reservationExpiry - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [reservationExpiry]);

  useEffect(() => {
    if (secondsLeft === 0 && reservationExpiry && !hasExpiredRef.current) {
      hasExpiredRef.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        "Tiempo agotado",
        "Tu reserva de horario ha expirado. Selecciona un nuevo horario.",
        [{
          text: "Volver",
          onPress: () => navigation.goBack(),
        }]
      );
    }
  }, [secondsLeft, reservationExpiry, navigation]);

  const isTimerActive = !!reservationExpiry && secondsLeft > 0;
  const isTimeLow = secondsLeft <= 60;
  const timerColor = isTimeLow ? Colors.error : Colors.warning;

  const formatCountdown = (secs: number): string => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const isBookingWithPackage = !!preselectedMembershipId;
  const [selectedMembershipId, setSelectedMembershipId] = useState<string | null>(preselectedMembershipId || null);
  const isUsingMembership = !!selectedMembershipId;

  const [userData, setUserData] = useState<UserData | null>(null);

  useFocusEffect(
    useCallback(() => {
      const loadUserData = async () => {
        const data = await getUserData();
        setUserData(data);
      };
      loadUserData();
    }, [])
  );

  const activeMemberships = userData ? getActiveMemberships(userData).filter(
    (a) => a.membership.vehicleSize === vehicleSize
  ) : [];

  useEffect(() => {
    if (preselectedMembershipId && userData) {
      const isValid = activeMemberships.some(
        (a) => a.membership.id === preselectedMembershipId
      );
      if (!isValid) {
        setSelectedMembershipId(null);
      }
    }
  }, [userData]);

  const handleMembershipSelect = (membershipId: string | null) => {
    Haptics.selectionAsync();
    setSelectedMembershipId(membershipId);
  };

  const [selectedPayment, setSelectedPayment] = useState<string>("");
  const [companyPaymentMethods, setCompanyPaymentMethods] = useState<PaymentMethodOption[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [servicesExpanded, setServicesExpanded] = useState(false);

  // Métodos de pago aceptados por la empresa asignada. Si la empresa no tiene
  // ninguno activo, la lista queda vacía y el componente lo muestra.
  useEffect(() => {
    if (!companyId) {
      setCompanyPaymentMethods([]);
      return;
    }
    let cancelled = false;
    fetchCompanyPaymentMethods(companyId).then((list) => {
      if (cancelled) return;
      setCompanyPaymentMethods(list);
      setSelectedPayment((current) => {
        if (current && list.some((m) => m.id === current)) return current;
        return list[0]?.id ?? "";
      });
    });
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  const selectedAddOns = ALL_SERVICES.filter((s) => addOns.includes(s.id));

  const matchedPackageInfo = useMemo(() => {
    if (!isBookingWithPackage || !userData) return null;
    const actives = getActiveMemberships(userData);
    const found = actives.find((a) => a.membership.id === preselectedMembershipId);
    if (!found) return null;
    const duration = found.package.durations.find((d) => d.id === found.membership.durationId);
    return {
      packageName: found.package.name,
      packageColor: found.package.color,
      packageIcon: found.package.id === "premium" ? "award" as const : found.package.id === "completo" ? "star" as const : "check-circle" as const,
      washesRemaining: found.membership.washesRemaining,
      totalWashes: duration ? duration.washesIncluded : found.membership.washesRemaining,
      daysRemaining: found.daysRemaining,
      durationLabel: duration ? duration.label : "",
    };
  }, [isBookingWithPackage, userData, preselectedMembershipId]);

  const allIncludedServices = useMemo(() => {
    const includedByWash = ALL_SERVICES.filter((s) => s.includedIn.includes(washType));
    const extras = ALL_SERVICES.filter(
      (s) => addOns.includes(s.id) && !s.includedIn.includes(washType)
    );
    return [
      ...includedByWash.map((s) => ({ ...s, isIncluded: true })),
      ...extras.map((s) => ({ ...s, isIncluded: false })),
    ];
  }, [washType, addOns]);

  const handlePaymentSelect = (id: string) => {
    Haptics.selectionAsync();
    setSelectedPayment(id);
  };

  const handlePay = async () => {
    if (reservationExpiry && Date.now() >= reservationExpiry) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        "Tiempo agotado",
        "Tu reserva de horario ha expirado. Selecciona un nuevo horario.",
        [{ text: "Volver", onPress: () => navigation.goBack() }]
      );
      return;
    }

    setIsProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (reservationExpiry && Date.now() >= reservationExpiry) {
      setIsProcessing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        "Tiempo agotado",
        "Tu reserva expiró durante el procesamiento. Selecciona un nuevo horario.",
        [{ text: "Volver", onPress: () => navigation.goBack() }]
      );
      return;
    }

    if (isUsingMembership && selectedMembershipId) {
      const result = await useMembershipWash(selectedMembershipId);
      if (!result) {
        setIsProcessing(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(
          "Error",
          "No se pudo usar la lavada del paquete. Verifica que tu paquete siga activo.",
          [{ text: "OK" }]
        );
        return;
      }
    }

    const booking: Booking = {
      id: generateId(),
      vehicleSize,
      washType,
      addOns,
      date,
      time,
      totalPrice: isUsingMembership ? 0 : totalPrice,
      status: "upcoming",
      createdAt: new Date().toISOString(),
      usedMembership: isUsingMembership,
      companyId,
      companyName,
      vehicleBrand,
      vehicleModel,
      vehicleColor,
      vehiclePlate,
      addressLabel,
      comments,
    };

    await saveBooking(booking);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsProcessing(false);

    navigation.navigate("Confirmation", { booking });
  };

  return (
    <ThemedView style={styles.container}>
      {isTimerActive ? (
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={[
            styles.timerBar,
            { backgroundColor: timerColor + "15" },
          ]}
        >
          <View style={styles.timerContent}>
            <View style={styles.timerLeft}>
              <View style={[styles.timerIconCircle, { backgroundColor: timerColor + "25" }]}>
                <Feather name="clock" size={16} color={timerColor} />
              </View>
              <ThemedText type="small" style={{ color: timerColor, fontWeight: "700" }}>
                Completa tu pago
              </ThemedText>
            </View>
            <View style={[styles.timerBadge, { backgroundColor: timerColor }]}>
              <Feather name="clock" size={12} color="#FFFFFF" />
              <ThemedText type="body" style={styles.timerText}>
                {formatCountdown(secondsLeft)}
              </ThemedText>
            </View>
          </View>
          <View style={[styles.timerProgressBg, { backgroundColor: timerColor + "20" }]}>
            <View
              style={[
                styles.timerProgressFill,
                {
                  backgroundColor: timerColor,
                  width: `${(secondsLeft / (5 * 60)) * 100}%`,
                },
              ]}
            />
          </View>
        </Animated.View>
      ) : null}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <ThemedText type="h2" style={styles.sectionTitle}>
            Resumen del Pedido
          </ThemedText>
          <Card elevation={1} style={styles.summaryCard}>
            <View style={styles.vehicleSummaryRow}>
              <Image
                source={VEHICLE_IMAGES[vehicleSize]}
                style={styles.vehicleSummaryImage}
                contentFit="contain"
              />
              <View style={styles.vehicleSummaryInfo}>
                <ThemedText type="h3">
                  {vehicleBrand} {vehicleModel}
                </ThemedText>
                <View style={styles.vehicleSummaryMeta}>
                  <View style={styles.vehicleMetaItem}>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      Color:
                    </ThemedText>
                    <ThemedText type="small" style={{ fontWeight: "600" }}>
                      {vehicleColor}
                    </ThemedText>
                  </View>
                  {vehiclePlate ? (
                    <View style={styles.vehicleMetaItem}>
                      <ThemedText type="small" style={{ color: theme.textSecondary }}>
                        Placa:
                      </ThemedText>
                      <ThemedText type="small" style={{ fontWeight: "600" }}>
                        {vehiclePlate}
                      </ThemedText>
                    </View>
                  ) : null}
                  <View style={styles.vehicleMetaItem}>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      Tamaño:
                    </ThemedText>
                    <ThemedText type="small" style={{ fontWeight: "600" }}>
                      {getVehicleName(vehicleSize)}
                    </ThemedText>
                  </View>
                </View>
              </View>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                Tipo de Lavado
              </ThemedText>
              <View style={{ alignItems: "flex-end" }}>
                <ThemedText type="body">{getWashTypeName(washType)}</ThemedText>
                {!isBookingWithPackage ? (() => {
                  const price = getWashTypePriceForSize(washType, vehicleSize);
                  return price !== null ? (
                    <ThemedText type="small" style={{ color: Colors.success, fontWeight: "600" }}>
                      {formatPrice(price)}
                    </ThemedText>
                  ) : null;
                })() : null}
              </View>
            </View>
            {allIncludedServices.length > 0 ? (
              <View>
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    setServicesExpanded(!servicesExpanded);
                  }}
                  style={styles.summaryRow}
                >
                  <View style={styles.servicesToggle}>
                    <ThemedText type="body" style={{ color: theme.textSecondary }}>
                      Servicios Incluidos
                    </ThemedText>
                    <View style={[styles.servicesBadge, { backgroundColor: (isDark ? Colors.accent : Colors.primary) + "15" }]}>
                      <ThemedText type="small" style={{ color: isDark ? Colors.accent : Colors.primary, fontWeight: "600" }}>
                        {allIncludedServices.length}
                      </ThemedText>
                    </View>
                  </View>
                  <Feather
                    name={servicesExpanded ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={isDark ? Colors.accent : Colors.primary}
                  />
                </Pressable>
                {servicesExpanded ? (
                  <View style={styles.servicesExpandedList}>
                    {allIncludedServices.filter(s => s.isIncluded).map((service) => (
                      <View key={service.id} style={styles.serviceItem}>
                        <View style={styles.serviceItemLeft}>
                          <Feather name="check-circle" size={14} color={Colors.success} />
                          <ThemedText type="body" style={{ fontSize: 14 }}>
                            {service.name}
                          </ThemedText>
                        </View>
                        <ThemedText
                          type="small"
                          style={{ color: Colors.success, fontWeight: "600" }}
                        >
                          Incluido
                        </ThemedText>
                      </View>
                    ))}
                    {allIncludedServices.filter(s => !s.isIncluded).length > 0 ? (
                      <>
                        <View style={styles.servicesDivider} />
                        <ThemedText type="caption" style={{ color: theme.textSecondary, fontWeight: "600", marginBottom: Spacing.xs }}>
                          Servicios Adicionales
                        </ThemedText>
                        {allIncludedServices.filter(s => !s.isIncluded).map((service) => (
                          <View key={service.id} style={styles.serviceItem}>
                            <View style={styles.serviceItemLeft}>
                              <Feather name="plus-circle" size={14} color={Colors.warning} />
                              <ThemedText type="body" style={{ fontSize: 14 }}>
                                {service.name}
                              </ThemedText>
                            </View>
                            <ThemedText
                              type="small"
                              style={{ color: Colors.warning, fontWeight: "600" }}
                            >
                              +{formatPrice(service.price)}
                            </ThemedText>
                          </View>
                        ))}
                      </>
                    ) : null}
                  </View>
                ) : null}
              </View>
            ) : null}
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                Dirección
              </ThemedText>
              <View style={{ flex: 1, marginLeft: Spacing.lg, alignItems: "flex-end" }}>
                <ThemedText type="body" style={{ textAlign: "right" }}>
                  {addressLabel}
                </ThemedText>
              </View>
            </View>
            {comments ? (
              <>
                <View style={styles.summaryDivider} />
                <View>
                  <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
                    Indicaciones
                  </ThemedText>
                  <ThemedText type="small" style={{ color: theme.text }}>
                    {comments}
                  </ThemedText>
                </View>
              </>
            ) : null}
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                Fecha
              </ThemedText>
              <ThemedText type="body">{formatDate(date)}</ThemedText>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                Hora
              </ThemedText>
              <ThemedText type="body">{time}</ThemedText>
            </View>
            {!isBookingWithPackage ? (
              <>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <ThemedText type="h3">Total</ThemedText>
                  <ThemedText
                    type="h2"
                    style={{ color: isDark ? Colors.accent : Colors.primary }}
                  >
                    {formatPrice(totalPrice)}
                  </ThemedText>
                </View>
              </>
            ) : null}
          </Card>
        </Animated.View>

        {isBookingWithPackage && matchedPackageInfo ? (
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <ThemedText type="h2" style={styles.sectionTitle}>
              Tu Paquete
            </ThemedText>
            <Card elevation={1} style={[styles.membershipActiveCard, { backgroundColor: matchedPackageInfo.packageColor + "10" }]}>
              <View style={styles.membershipBadge}>
                <View style={[styles.packageIcon, { backgroundColor: matchedPackageInfo.packageColor }]}>
                  <Feather name={matchedPackageInfo.packageIcon} size={18} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText type="body" style={{ fontWeight: "600" }}>
                    {matchedPackageInfo.packageName} {matchedPackageInfo.durationLabel ? `\u00B7 ${matchedPackageInfo.durationLabel}` : ""}
                  </ThemedText>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.md, marginTop: 2 }}>
                    <ThemedText type="small" style={{ color: matchedPackageInfo.packageColor, fontWeight: "700" }}>
                      {matchedPackageInfo.washesRemaining}/{matchedPackageInfo.totalWashes} lavadas
                    </ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      {matchedPackageInfo.daysRemaining}d restantes
                    </ThemedText>
                  </View>
                </View>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.xs, marginTop: Spacing.sm }}>
                <Feather name="info" size={12} color={theme.textSecondary} />
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Se descontará 1 lavada al confirmar
                </ThemedText>
              </View>
            </Card>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <ThemedText type="h2" style={styles.sectionTitle}>
              Método de Pago
            </ThemedText>

            {activeMemberships.length > 0 ? (
              <View style={styles.paymentMethods}>
                <Pressable
                  onPress={() => handleMembershipSelect(null)}
                  style={[
                    styles.paymentMethod,
                    {
                      backgroundColor: !isUsingMembership
                        ? isDark
                          ? "rgba(6, 182, 212, 0.15)"
                          : "rgba(30, 64, 175, 0.08)"
                        : theme.backgroundDefault,
                      borderColor: !isUsingMembership
                        ? isDark
                          ? Colors.accent
                          : Colors.primary
                        : theme.backgroundTertiary,
                    },
                  ]}
                >
                  <Feather
                    name="credit-card"
                    size={24}
                    color={
                      !isUsingMembership
                        ? isDark
                          ? Colors.accent
                          : Colors.primary
                        : theme.textSecondary
                    }
                  />
                  <View style={styles.paymentInfo}>
                    <ThemedText type="body">Pago Directo</ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      Paga esta lavada individualmente
                    </ThemedText>
                  </View>
                  <View
                    style={[
                      styles.radioOuter,
                      {
                        borderColor: !isUsingMembership
                          ? isDark
                            ? Colors.accent
                            : Colors.primary
                          : theme.textSecondary,
                      },
                    ]}
                  >
                    {!isUsingMembership ? (
                      <View
                        style={[
                          styles.radioInner,
                          {
                            backgroundColor: isDark
                              ? Colors.accent
                              : Colors.primary,
                          },
                        ]}
                      />
                    ) : null}
                  </View>
                </Pressable>

                {activeMemberships.map(({ package: pkg, membership, daysRemaining }) => {
                  const isSelected = selectedMembershipId === membership.id;
                  return (
                    <Pressable
                      key={membership.id}
                      onPress={() => handleMembershipSelect(membership.id)}
                      style={[
                        styles.paymentMethod,
                        {
                          backgroundColor: isSelected
                            ? pkg.color + "20"
                            : theme.backgroundDefault,
                          borderColor: isSelected
                            ? pkg.color
                            : theme.backgroundTertiary,
                        },
                      ]}
                    >
                      <View style={[styles.packageIcon, { backgroundColor: pkg.color }]}>
                        <Feather
                          name={pkg.id === "premium" ? "award" : pkg.id === "completo" ? "star" : "check-circle"}
                          size={18}
                          color="#FFFFFF"
                        />
                      </View>
                      <View style={styles.paymentInfo}>
                        <ThemedText type="body">{pkg.name}</ThemedText>
                        <View style={styles.packageMeta}>
                          <ThemedText type="small" style={{ color: pkg.color, fontWeight: "600" }}>
                            {membership.washesRemaining} lavadas
                          </ThemedText>
                          <ThemedText type="small" style={{ color: theme.textSecondary }}>
                            {daysRemaining} días
                          </ThemedText>
                        </View>
                      </View>
                      <View
                        style={[
                          styles.radioOuter,
                          { borderColor: isSelected ? pkg.color : theme.textSecondary },
                        ]}
                      >
                        {isSelected ? (
                          <View
                            style={[styles.radioInner, { backgroundColor: pkg.color }]}
                          />
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            <View style={styles.cardPaymentSection}>
              <PaymentMethodSelector
                methods={companyPaymentMethods}
                selectedId={selectedPayment}
                onSelect={handlePaymentSelect}
              />

              <View style={styles.secureNote}>
                <Feather name="lock" size={16} color={theme.textSecondary} />
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Pago seguro encriptado
                </ThemedText>
              </View>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: theme.backgroundDefault,
            paddingBottom: insets.bottom + Spacing.lg,
          },
        ]}
      >
        <Button
          onPress={handlePay}
          disabled={isProcessing}
          style={[styles.payButton, { backgroundColor: Colors.success }]}
        >
          {isProcessing
            ? "Procesando..."
            : isUsingMembership
            ? "Confirmar Cita"
            : `Pagar ${formatPrice(totalPrice)}`}
        </Button>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  timerBar: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  timerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  timerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  timerIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  timerText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  timerProgressBg: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  timerProgressFill: {
    height: 4,
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  summaryCard: {
    marginBottom: Spacing.xl,
  },
  vehicleSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  vehicleSummaryImage: {
    width: 56,
    height: 56,
    marginRight: Spacing.md,
  },
  vehicleSummaryInfo: {
    flex: 1,
  },
  vehicleSummaryMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginTop: 4,
  },
  vehicleMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginVertical: Spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "rgba(128, 128, 128, 0.2)",
    marginVertical: Spacing.md,
  },
  servicesToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  servicesBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 22,
    alignItems: "center",
  },
  servicesExpandedList: {
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  servicesDivider: {
    height: 1,
    backgroundColor: "rgba(128, 128, 128, 0.2)",
    marginVertical: Spacing.sm,
  },
  serviceItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingLeft: Spacing.xs,
  },
  serviceItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  cardPaymentSection: {
    marginTop: Spacing.sm,
  },
  packageIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  packageMeta: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: 2,
  },
  membershipActiveCard: {
    marginTop: Spacing.md,
  },
  paymentMethods: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  paymentMethod: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
  },
  paymentInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  secureNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xl,
  },
  footer: {
    padding: Spacing.xl,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  payButton: {
    backgroundColor: Colors.success,
  },
  membershipBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
});
