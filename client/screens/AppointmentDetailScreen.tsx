import React, { useState, useMemo, useCallback } from "react";
import { StyleSheet, View, ScrollView, Alert, Pressable } from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useRoute, useFocusEffect, RouteProp } from "@react-navigation/native";
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
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import {
  updateBooking,
  saveBooking,
  getBookings,
  formatDate,
  formatPrice,
  getVehicleName,
  getWashTypeName,
  getWashTypePriceForSize,
  ALL_SERVICES,
  WASH_OFFERINGS,
  VEHICLE_PRICES,
  WASH_TYPE_PRICES,
  Booking,
  VehicleSize,
} from "@/lib/storage";
import { getBookingDisplayStatus } from "@/lib/booking-status";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, "AppointmentDetail">;

const VEHICLE_IMAGES: Record<VehicleSize, any> = {
  small: vehicleSmall,
  suv: vehicleSuv,
  large: vehicleLarge,
};

function getServiceDateTime(booking: Booking): Date {
  const dateObj = new Date(booking.date);
  const match = booking.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3].toUpperCase();
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    dateObj.setHours(hours, minutes, 0, 0);
  }
  return dateObj;
}

export default function AppointmentDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [booking, setBooking] = useState<Booking>(route.params.booking);
  const [servicesExpanded, setServicesExpanded] = useState(false);

  const openReschedule = () => {
    navigation.navigate("RescheduleBooking", {
      washType: booking.washType,
      addOns: booking.addOns,
      onConfirm: handleRescheduleConfirm,
    });
  };

  const openRescheduleAfterReject = () => {
    navigation.navigate("RescheduleBooking", {
      washType: booking.washType,
      addOns: booking.addOns,
      onConfirm: handleRescheduleAfterReject,
    });
  };

  const handleRescheduleAfterReject = async (
    selectedDate: Date,
    selectedTime: string,
    _reservationExpiry: number,
    company: { id: string; name: string },
  ) => {
    const isoDate = selectedDate.toISOString();
    const newBooking: Booking = {
      ...booking,
      id: `bk_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
      status: "upcoming",
      bookingStatus: "pending",
      cancelReason: undefined,
      cancelledBy: undefined,
      date: isoDate,
      time: selectedTime,
      companyId: company.id,
      companyName: company.name,
      createdAt: new Date().toISOString(),
    };
    await saveBooking(newBooking);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const displayDate = selectedDate.toLocaleDateString("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    Alert.alert(
      "Nueva reserva creada",
      `Tu reserva fue enviada a ${company.name} para el ${displayDate} a las ${selectedTime}.`,
      [
        {
          text: "Ver mis citas",
          onPress: () => navigation.navigate("MainTabs", { screen: "Citas" } as any),
        },
      ],
    );
  };

  useFocusEffect(
    useCallback(() => {
      const reloadBooking = async () => {
        const allBookings = await getBookings();
        const updated = allBookings.find((b) => b.id === booking.id);
        if (updated) {
          setBooking(updated);
        }
      };
      reloadBooking();
    }, [booking.id])
  );

  const allIncludedServices = useMemo(() => {
    // 1. Servicios incluidos por el tipo de lavado. Para wash_offerings nuevos
    //    leemos directo de WASH_OFFERINGS.services (la fuente de verdad).
    //    Para wash types legacy seguimos usando ALL_SERVICES.includedIn.
    const offering = WASH_OFFERINGS.find((o) => o.slug === booking.washType);
    const includedFromOffering = offering
      ? offering.services.map((s) => ({
          id: s.id,
          name: s.name,
          price: Number(s.price ?? 0),
          isIncluded: true as const,
        }))
      : ALL_SERVICES.filter((s) => s.includedIn.includes(booking.washType)).map((s) => ({
          id: s.id,
          name: s.name,
          price: Number(s.price ?? 0),
          isIncluded: true as const,
        }));

    const includedIds = new Set(includedFromOffering.map((s) => s.id));

    // 2. Extras: addOns guardados en la reserva que no están en el set incluido.
    const extras = booking.addOns
      .filter((id) => !includedIds.has(id))
      .map((id) => {
        const fromAll = ALL_SERVICES.find((s) => s.id === id);
        const fromOffering = offering?.services.find((s) => s.id === id || s.slug === id);
        const svc = fromAll ?? fromOffering;
        if (!svc) return null;
        return {
          id: svc.id,
          name: svc.name,
          price: Number((svc as { price?: number }).price ?? 0),
          isIncluded: false as const,
        };
      })
      .filter((s): s is { id: string; name: string; price: number; isIncluded: false } => s !== null);

    return [...includedFromOffering, ...extras];
  }, [booking.washType, booking.addOns]);

  const canReschedule = useMemo(() => {
    if (booking.status !== "upcoming") return false;
    if (booking.pendingReschedule) {
      if (booking.rescheduleDeadline) {
        return new Date() < new Date(booking.rescheduleDeadline);
      }
      return true;
    }
    const serviceTime = getServiceDateTime(booking);
    const now = new Date();
    const hoursUntilService = (serviceTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilService >= 2;
  }, [booking]);

  const display = getBookingDisplayStatus(booking);
  const wasRejectedByCompany =
    booking.status === "cancelled" && booking.cancelledBy === "company";
  // Si la empresa ya inició el servicio (in_progress) no se puede reprogramar.
  // Completed/cancelled ya quedan fuera porque el bloque envolvente revisa status === "upcoming".
  const isInProgress = booking.bookingStatus === "in_progress";

  const handleReschedule = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!canReschedule) {
      Alert.alert(
        "No se puede reprogramar",
        "Solo puedes reprogramar tu cita hasta 2 horas antes del servicio.",
        [{ text: "Entendido" }]
      );
      return;
    }
    if (booking.pendingReschedule) {
      openReschedule();
      return;
    }
    Alert.alert(
      "Reprogramar Cita",
      "¿Qué deseas hacer?",
      [
        {
          text: "Agendar después",
          onPress: async () => {
            const deadline = new Date();
            deadline.setDate(deadline.getDate() + 7);
            const updatedBooking: Booking = {
              ...booking,
              pendingReschedule: true,
              rescheduleDeadline: deadline.toISOString(),
            };
            await updateBooking(updatedBooking);
            setBooking(updatedBooking);
            Alert.alert(
              "Cita pendiente",
              "Podrás agendar tu cita desde hoy y hasta 7 días. Recuerda reprogramar antes de que venza el plazo.",
              [{ text: "Entendido" }]
            );
          },
        },
        {
          text: "Agendar nuevamente",
          onPress: () => openReschedule(),
        },
      ]
    );
  };

  const handleRescheduleConfirm = async (
    selectedDate: Date,
    selectedTime: string,
    _reservationExpiry: number,
    company: { id: string; name: string },
  ) => {
    const updatedBooking: Booking = {
      ...booking,
      date: selectedDate.toISOString(),
      time: selectedTime,
      companyId: company.id,
      companyName: company.name,
      pendingReschedule: undefined,
      rescheduleDeadline: undefined,
    };
    await updateBooking(updatedBooking);
    setBooking(updatedBooking);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const displayDate = selectedDate.toLocaleDateString("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    Alert.alert(
      "Cita reprogramada",
      `Tu cita ha sido reprogramada para el ${displayDate} a las ${selectedTime}.`,
      [{ text: "Entendido" }]
    );
  };

  const handleServiceCompleted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("ServiceFeedback", { booking });
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
        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <View
            style={[
              styles.statusBanner,
              { backgroundColor: `${display.color}15` },
            ]}
          >
            <View
              style={[styles.statusDot, { backgroundColor: display.color }]}
            />
            <ThemedText type="h3" style={{ color: display.color }}>
              {display.label}
            </ThemedText>
          </View>
        </Animated.View>

        {wasRejectedByCompany ? (
          <Animated.View entering={FadeInDown.delay(75).springify()}>
            <Card
              elevation={1}
              style={[styles.rejectionCard, { borderColor: Colors.error + "40" }]}
            >
              <View style={styles.rejectionHeader}>
                <Feather name="alert-circle" size={18} color={Colors.error} />
                <ThemedText type="h3" style={{ color: Colors.error }}>
                  Motivo del rechazo
                </ThemedText>
              </View>
              <ThemedText type="body" style={{ color: theme.text, marginTop: Spacing.xs }}>
                {booking.cancelReason ?? "La empresa no atendió esta reserva."}
              </ThemedText>
              <Button
                onPress={openRescheduleAfterReject}
                style={[styles.rescheduleAfterRejectButton, { backgroundColor: isDark ? Colors.accent : Colors.primary }]}
                textColor="#FFFFFF"
              >
                Reagendar
              </Button>
            </Card>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Card elevation={1} style={styles.summaryCard}>
            <View style={styles.vehicleSummaryRow}>
              <Image
                source={VEHICLE_IMAGES[booking.vehicleSize]}
                style={styles.vehicleSummaryImage}
                contentFit="contain"
              />
              <View style={styles.vehicleSummaryInfo}>
                <ThemedText type="h3">
                  {booking.vehicleBrand && booking.vehicleModel
                    ? `${booking.vehicleBrand} ${booking.vehicleModel}`
                    : getVehicleName(booking.vehicleSize)}
                </ThemedText>
                <View style={styles.vehicleSummaryMeta}>
                  {booking.vehicleColor ? (
                    <View style={styles.vehicleMetaItem}>
                      <ThemedText type="small" style={{ color: theme.textSecondary }}>
                        Color:
                      </ThemedText>
                      <ThemedText type="small" style={{ fontWeight: "600" }}>
                        {booking.vehicleColor}
                      </ThemedText>
                    </View>
                  ) : null}
                  {booking.vehiclePlate ? (
                    <View style={styles.vehicleMetaItem}>
                      <ThemedText type="small" style={{ color: theme.textSecondary }}>
                        Placa:
                      </ThemedText>
                      <ThemedText type="small" style={{ fontWeight: "600" }}>
                        {booking.vehiclePlate}
                      </ThemedText>
                    </View>
                  ) : null}
                  <View style={styles.vehicleMetaItem}>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      Tamaño:
                    </ThemedText>
                    <ThemedText type="small" style={{ fontWeight: "600" }}>
                      {getVehicleName(booking.vehicleSize)}
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
                <ThemedText type="body">{getWashTypeName(booking.washType)}</ThemedText>
                {!booking.usedMembership ? (() => {
                  const price = getWashTypePriceForSize(booking.washType, booking.vehicleSize);
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
                      Servicios
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
                    {allIncludedServices.map((service, index) => {
                      const prevService = index > 0 ? allIncludedServices[index - 1] : null;
                      const showDivider = prevService !== null && prevService.isIncluded && !service.isIncluded;
                      return (
                        <View key={service.id}>
                          {showDivider ? (
                            <View style={styles.servicesDivider} />
                          ) : null}
                          <View style={styles.serviceItem}>
                            <View style={styles.serviceItemLeft}>
                              <Feather
                                name={service.isIncluded ? "check-circle" : "plus-circle"}
                                size={14}
                                color={service.isIncluded ? Colors.success : Colors.warning}
                              />
                              <ThemedText type="body" style={{ fontSize: 14 }}>
                                {service.name}
                              </ThemedText>
                            </View>
                            <ThemedText
                              type="small"
                              style={{
                                color: service.isIncluded ? Colors.success : Colors.warning,
                                fontWeight: "600",
                              }}
                            >
                              {service.isIncluded ? "Incluido" : `+${formatPrice(service.price)}`}
                            </ThemedText>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            ) : null}

            <View style={styles.summaryDivider} />

            {booking.addressLabel ? (
              <>
                <View style={styles.summaryRow}>
                  <ThemedText type="body" style={{ color: theme.textSecondary }}>
                    Dirección
                  </ThemedText>
                  <View style={{ flex: 1, marginLeft: Spacing.lg, alignItems: "flex-end" }}>
                    <ThemedText type="body" style={{ textAlign: "right" }}>
                      {booking.addressLabel}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.summaryDivider} />
              </>
            ) : null}

            {booking.comments ? (
              <>
                <View>
                  <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
                    Indicaciones
                  </ThemedText>
                  <ThemedText type="small" style={{ color: theme.text }}>
                    {booking.comments}
                  </ThemedText>
                </View>
                <View style={styles.summaryDivider} />
              </>
            ) : null}

            <View style={styles.summaryRow}>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                Fecha
              </ThemedText>
              {booking.pendingReschedule ? (
                <ThemedText type="body" style={{ color: Colors.error, fontWeight: "600" }}>
                  Por asignar
                </ThemedText>
              ) : (
                <ThemedText type="body">{formatDate(booking.date)}</ThemedText>
              )}
            </View>
            <View style={styles.summaryRow}>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                Hora
              </ThemedText>
              {booking.pendingReschedule ? (
                <ThemedText type="body" style={{ color: Colors.error, fontWeight: "600" }}>
                  Por asignar
                </ThemedText>
              ) : (
                <ThemedText type="body">{booking.time}</ThemedText>
              )}
            </View>

            {booking.bookingStatus === "in_progress" ||
            booking.bookingStatus === "completed" ||
            booking.startedAt ||
            booking.completedAt ? (
              <>
                <View style={styles.summaryRow}>
                  <ThemedText type="body" style={{ color: theme.textSecondary }}>
                    Hora de inicio
                  </ThemedText>
                  <ThemedText type="body">
                    {booking.startedAt
                      ? new Date(booking.startedAt).toLocaleTimeString("es-MX", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </ThemedText>
                </View>
                <View style={styles.summaryRow}>
                  <ThemedText type="body" style={{ color: theme.textSecondary }}>
                    Hora de finalización
                  </ThemedText>
                  <ThemedText type="body">
                    {booking.completedAt
                      ? new Date(booking.completedAt).toLocaleTimeString("es-MX", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </ThemedText>
                </View>
              </>
            ) : null}

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                Método de pago
              </ThemedText>
              <ThemedText type="body" style={{ fontWeight: "600", color: booking.usedMembership ? Colors.success : theme.text }}>
                {booking.usedMembership ? "Pago con paquete" : "Pago directo"}
              </ThemedText>
            </View>

            {booking.usedMembership ? (
              <View style={styles.summaryRow}>
                <ThemedText type="body" style={{ color: theme.textSecondary }}>
                  Costo
                </ThemedText>
                <ThemedText type="body" style={{ color: Colors.success, fontWeight: "600" }}>
                  Incluido en paquete
                </ThemedText>
              </View>
            ) : (
              <View style={styles.summaryRow}>
                <ThemedText type="h3">Total Pagado</ThemedText>
                <ThemedText
                  type="h2"
                  style={{ color: isDark ? Colors.accent : Colors.primary }}
                >
                  {formatPrice(booking.totalPrice)}
                </ThemedText>
              </View>
            )}
          </Card>
        </Animated.View>

        {booking.status === "completed" && !booking.feedbackRating ? (
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <Card elevation={1} style={styles.feedbackCard}>
              <View style={styles.feedbackHeader}>
                <Feather name="star" size={20} color={Colors.warning} />
                <ThemedText type="h3">Califica este servicio</ThemedText>
              </View>
              <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
                Cuéntanos cómo te fue: deja tu calificación y un comentario para la empresa.
              </ThemedText>
              <Button
                onPress={handleServiceCompleted}
                style={[styles.rescheduleAfterRejectButton, { backgroundColor: isDark ? Colors.accent : Colors.primary }]}
                textColor="#FFFFFF"
              >
                Calificar y comentar
              </Button>
            </Card>
          </Animated.View>
        ) : null}

        {booking.status === "completed" && booking.feedbackRating ? (
          <Animated.View
            entering={FadeInDown.delay(300).springify()}
          >
            <Card elevation={1} style={styles.feedbackCard}>
              <View style={styles.feedbackHeader}>
                <Feather name="message-circle" size={20} color={isDark ? Colors.accent : Colors.primary} />
                <ThemedText type="h3">Tu Opinión</ThemedText>
              </View>

              <View style={styles.feedbackRow}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>Calificación</ThemedText>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Feather
                      key={star}
                      name="star"
                      size={16}
                      color={star <= (booking.feedbackRating || 0) ? Colors.warning : theme.textSecondary + "30"}
                    />
                  ))}
                </View>
              </View>

              {booking.feedbackCleanliness ? (
                <View style={styles.feedbackRow}>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>Limpieza</ThemedText>
                  <ThemedText type="small" style={{ fontWeight: "600" }}>
                    {booking.feedbackCleanliness === "excelente" ? "Excelente"
                      : booking.feedbackCleanliness === "buena" ? "Buena"
                      : booking.feedbackCleanliness === "regular" ? "Regular"
                      : "Mala"}
                  </ThemedText>
                </View>
              ) : null}

              {booking.feedbackPunctuality ? (
                <View style={styles.feedbackRow}>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>Puntualidad</ThemedText>
                  <ThemedText type="small" style={{ fontWeight: "600" }}>
                    {booking.feedbackPunctuality === "a_tiempo" ? "A tiempo"
                      : booking.feedbackPunctuality === "leve_retraso" ? "Leve retraso"
                      : "Con retraso"}
                  </ThemedText>
                </View>
              ) : null}

              {booking.feedbackExtras && booking.feedbackExtras.length > 0 ? (
                <View style={styles.feedbackExtrasSection}>
                  <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>Destacados</ThemedText>
                  <View style={styles.feedbackChips}>
                    {booking.feedbackExtras.map((extra) => {
                      const labels: Record<string, string> = {
                        amabilidad: "Amabilidad del personal",
                        productos: "Buenos productos",
                        rapidez: "Rapidez del servicio",
                        detallado: "Trabajo detallado",
                        recomendaria: "Lo recomendaría",
                      };
                      return (
                        <View
                          key={extra}
                          style={[styles.feedbackChip, { backgroundColor: (isDark ? Colors.accent : Colors.primary) + "15" }]}
                        >
                          <Feather name="check" size={12} color={isDark ? Colors.accent : Colors.primary} />
                          <ThemedText type="small" style={{ color: isDark ? Colors.accent : Colors.primary, fontWeight: "600" }}>
                            {labels[extra] || extra}
                          </ThemedText>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ) : null}

              {booking.feedbackComment ? (
                <View style={[styles.feedbackCommentBox, { backgroundColor: theme.backgroundSecondary }]}>
                  <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>Comentario</ThemedText>
                  <ThemedText type="body">{booking.feedbackComment}</ThemedText>
                </View>
              ) : null}
            </Card>
          </Animated.View>
        ) : null}

        {booking.status === "upcoming" ? (
          <Animated.View
            entering={FadeInDown.delay(150).springify()}
            style={styles.actionsContainer}
          >
            {isInProgress ? null : booking.pendingReschedule ? (
              <View style={[styles.rescheduleNote, { backgroundColor: Colors.error + "15" }]}>
                <Feather name="alert-triangle" size={16} color={Colors.error} />
                <ThemedText type="small" style={{ color: Colors.error, flex: 1, fontWeight: "600" }}>
                  {booking.rescheduleDeadline
                    ? `Agenda antes del ${formatDate(booking.rescheduleDeadline)} o perderás tu cita completamente`
                    : "Debes agendar tu cita o la perderás completamente"}
                </ThemedText>
              </View>
            ) : (
              <View style={[styles.rescheduleNote, { backgroundColor: (canReschedule ? Colors.accent : Colors.warning) + "15" }]}>
                <Feather name="info" size={16} color={canReschedule ? Colors.accent : Colors.warning} />
                <ThemedText type="small" style={{ color: canReschedule ? Colors.accent : Colors.warning, flex: 1 }}>
                  {canReschedule
                    ? "Puedes reprogramar tu cita hasta 2 horas antes del servicio"
                    : "No puedes reprogramar a menos de 2 horas del servicio"}
                </ThemedText>
              </View>
            )}
            {isInProgress ? null : (
              <Button
                onPress={handleReschedule}
                style={[
                  styles.rescheduleButton,
                  {
                    backgroundColor: booking.pendingReschedule
                      ? (isDark ? Colors.accent : Colors.primary)
                      : canReschedule
                        ? theme.backgroundSecondary
                        : theme.backgroundTertiary,
                    opacity: canReschedule ? 1 : 0.6,
                  },
                ]}
                textColor={booking.pendingReschedule ? "#FFFFFF" : undefined}
              >
                Reprogramar Cita
              </Button>
            )}
            <Button
              onPress={handleServiceCompleted}
              style={[styles.completedButton, { backgroundColor: Colors.success + "15" }]}
              textColor={Colors.success}
            >
              Servicio Completado
            </Button>
          </Animated.View>
        ) : null}
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
    padding: Spacing.xl,
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.sm,
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
  summaryDivider: {
    height: 1,
    backgroundColor: "rgba(128, 128, 128, 0.15)",
    marginVertical: Spacing.md,
  },
  servicesToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  servicesBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: "center",
  },
  servicesExpandedList: {
    marginTop: Spacing.xs,
    gap: Spacing.xs,
  },
  servicesDivider: {
    height: 1,
    backgroundColor: "rgba(128, 128, 128, 0.1)",
    marginVertical: Spacing.xs,
  },
  serviceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  serviceItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  actionsContainer: {
    gap: Spacing.md,
  },
  rescheduleNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  rescheduleButton: {
    backgroundColor: "transparent",
  },
  completedButton: {
    backgroundColor: "transparent",
  },
  feedbackCard: {
    marginBottom: Spacing.lg,
  },
  feedbackHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  feedbackRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.xs,
  },
  starsRow: {
    flexDirection: "row",
    gap: 4,
  },
  feedbackExtrasSection: {
    paddingTop: Spacing.sm,
  },
  feedbackChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  feedbackChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  feedbackCommentBox: {
    marginTop: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  rejectionCard: {
    marginBottom: Spacing.xl,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  rejectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  rescheduleAfterRejectButton: {
    marginTop: Spacing.md,
  },
});
