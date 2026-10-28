import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { StyleSheet, View, Pressable, ScrollView, Alert, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import {
  WashType,
  getEstimatedTime,
  fetchAvailableCompanies,
  fetchCompanySlots,
  AvailableCompany,
} from "@/lib/storage";
import { getApiUrl } from "@/lib/query-client";

function resolveAssetUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return new URL(url, getApiUrl()).href;
}

const RESERVATION_SECONDS = 5 * 60;

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} minutos`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (remainder === 0) return hours === 1 ? "1 hora" : `${hours} horas`;
  if (remainder === 30) return hours === 1 ? "1 hora y media" : `${hours} horas y media`;
  const hourStr = hours === 1 ? "1 hora" : `${hours} horas`;
  return `${hourStr} y ${remainder} min`;
}

function formatTimeRange(min: number, max: number): string {
  return `${formatDuration(min)} a ${formatDuration(max)}`;
}

function generateDates(): { date: Date; label: string; dayName: string }[] {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dayName = date.toLocaleDateString("es-MX", { weekday: "short" });
    const label = date.getDate().toString();
    dates.push({ date, label, dayName });
  }
  return dates;
}

function companyInitials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

interface SchedulePickerProps {
  washType: WashType;
  addOns: string[];
  packageId?: string;
  onConfirm: (
    date: Date,
    time: string,
    reservationExpiry: number,
    company: { id: string; name: string },
  ) => void;
  showEstimatedTime?: boolean;
}

export function SchedulePicker({ washType, addOns, packageId, onConfirm, showEstimatedTime = true }: SchedulePickerProps) {
  const { theme, isDark } = useTheme();

  const dates = useMemo(() => generateDates(), []);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [companies, setCompanies] = useState<AvailableCompany[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<AvailableCompany | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(RESERVATION_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasExpiredRef = useRef(false);
  const expiryRef = useRef<number | null>(null);

  const isReserved = selectedDate !== null && selectedTime !== null && selectedCompany !== null;
  const estimatedTime = useMemo(() => getEstimatedTime(washType, addOns), [washType, addOns]);

  // Cargar empresas cada vez que cambia la fecha (o el wash/addOns en teoría no cambian dentro del picker).
  useEffect(() => {
    if (!selectedDate) {
      setCompanies([]);
      return;
    }
    let cancelled = false;
    setLoadingCompanies(true);
    fetchAvailableCompanies(washType, addOns, selectedDate.toISOString(), packageId)
      .then((list) => {
        if (cancelled) return;
        setCompanies(list);
      })
      .finally(() => {
        if (!cancelled) setLoadingCompanies(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedDate, washType, addOns, packageId]);

  // Cargar slots cuando hay empresa+fecha seleccionada.
  useEffect(() => {
    if (!selectedCompany || !selectedDate) {
      setSlots([]);
      return;
    }
    let cancelled = false;
    setLoadingSlots(true);
    fetchCompanySlots(selectedCompany.id, selectedDate.toISOString())
      .then((rows) => {
        if (cancelled) return;
        setSlots(rows.map((r) => r.time));
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCompany, selectedDate]);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    hasExpiredRef.current = false;
    const expiry = Date.now() + RESERVATION_SECONDS * 1000;
    expiryRef.current = expiry;
    setSecondsLeft(RESERVATION_SECONDS);
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((expiry - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (secondsLeft === 0 && isReserved && !hasExpiredRef.current) {
      hasExpiredRef.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        "Tiempo agotado",
        "Tu reserva de horario ha expirado. Por favor selecciona un nuevo horario.",
        [{ text: "Entendido" }]
      );
      setSelectedTime(null);
      setSecondsLeft(RESERVATION_SECONDS);
      expiryRef.current = null;
    }
  }, [secondsLeft, isReserved]);

  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  const handleDateSelect = (date: Date) => {
    Haptics.selectionAsync();
    setSelectedDate(date);
    // Cambiar fecha resetea empresa y hora — la lista de empresas y los slots
    // dependen de la fecha.
    setSelectedCompany(null);
    setSelectedTime(null);
    stopTimer();
  };

  const handleCompanySelect = (company: AvailableCompany) => {
    Haptics.selectionAsync();
    setSelectedCompany(company);
    setSelectedTime(null);
    stopTimer();
  };

  const handleTimeSelect = (time: string) => {
    Haptics.selectionAsync();
    setSelectedTime(time);
    if (selectedDate && selectedCompany) {
      startTimer();
    }
  };

  const handleConfirm = () => {
    if (selectedDate && selectedTime && selectedCompany && expiryRef.current) {
      stopTimer();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onConfirm(selectedDate, selectedTime, expiryRef.current, {
        id: selectedCompany.id,
        name: selectedCompany.name,
      });
    }
  };

  const isDateSelected = (date: Date) => {
    if (!selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const isTimeLow = secondsLeft <= 60;
  const timerColor = isTimeLow ? Colors.error : Colors.warning;
  const timerProgress = secondsLeft / RESERVATION_SECONDS;

  return (
    <View style={styles.container}>
      {isReserved ? (
        <Animated.View
          entering={FadeIn.duration(300)}
          style={[styles.timerBar, { backgroundColor: timerColor + "15" }]}
        >
          <View style={styles.timerContent}>
            <View style={styles.timerLeft}>
              <View style={[styles.timerIconCircle, { backgroundColor: timerColor + "25" }]}>
                <Feather name="clock" size={16} color={timerColor} />
              </View>
              <View>
                <ThemedText type="small" style={{ color: timerColor, fontWeight: "700" }}>
                  Horario reservado
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Completa tu reserva antes de que expire
                </ThemedText>
              </View>
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
                { backgroundColor: timerColor, width: `${timerProgress * 100}%` },
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
            Selecciona el Día
          </ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.datesContainer}
          >
            {dates.map((item, index) => {
              const isSelected = isDateSelected(item.date);
              const isToday = index === 0;
              return (
                <Pressable
                  key={index}
                  onPress={() => handleDateSelect(item.date)}
                  style={[
                    styles.dateCard,
                    {
                      backgroundColor: isSelected
                        ? isDark ? Colors.accent : Colors.primary
                        : theme.backgroundDefault,
                      borderColor: isSelected
                        ? isDark ? Colors.accent : Colors.primary
                        : theme.backgroundTertiary,
                    },
                  ]}
                >
                  <ThemedText
                    type="small"
                    style={{
                      color: isSelected ? "#FFFFFF" : theme.textSecondary,
                      textTransform: "uppercase",
                    }}
                  >
                    {isToday ? "Hoy" : item.dayName}
                  </ThemedText>
                  <ThemedText
                    type="h2"
                    style={{ color: isSelected ? "#FFFFFF" : theme.text }}
                  >
                    {item.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>

        {selectedDate ? (
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <ThemedText type="h2" style={styles.sectionTitle}>
              Selecciona la Empresa
            </ThemedText>
            {loadingCompanies ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color={isDark ? Colors.accent : Colors.primary} />
              </View>
            ) : companies.length === 0 ? (
              <View style={styles.emptyBox}>
                <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "center" }}>
                  No hay empresas disponibles para esta combinación de lavado y servicios.
                </ThemedText>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.companiesContainer}
              >
                {companies.map((company) => {
                  const isSelected = selectedCompany?.id === company.id;
                  const accent = isDark ? Colors.accent : Colors.primary;
                  return (
                    <Pressable
                      key={company.id}
                      onPress={() => handleCompanySelect(company)}
                      style={[
                        styles.companyCard,
                        {
                          backgroundColor: isSelected
                            ? isDark ? "rgba(6, 182, 212, 0.15)" : "rgba(30, 64, 175, 0.08)"
                            : theme.backgroundDefault,
                          borderColor: isSelected ? accent : theme.backgroundTertiary,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.companyLogoWrap,
                          {
                            backgroundColor: isSelected ? accent + "25" : theme.backgroundTertiary,
                            borderColor: isSelected ? accent : "transparent",
                          },
                        ]}
                      >
                        {resolveAssetUrl(company.logoUrl) ? (
                          <Image
                            source={{ uri: resolveAssetUrl(company.logoUrl)! }}
                            style={styles.companyLogo}
                            contentFit="cover"
                          />
                        ) : (
                          <ThemedText
                            type="h2"
                            style={{ color: isSelected ? accent : theme.textSecondary }}
                          >
                            {companyInitials(company.name)}
                          </ThemedText>
                        )}
                      </View>
                      <ThemedText
                        type="small"
                        numberOfLines={2}
                        style={{
                          color: isSelected ? accent : theme.text,
                          textAlign: "center",
                          fontWeight: isSelected ? "700" : "500",
                        }}
                      >
                        {company.name}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </Animated.View>
        ) : null}

        {selectedDate && selectedCompany ? (
          <Animated.View entering={FadeInDown.delay(150).springify()}>
            <ThemedText type="h2" style={styles.sectionTitle}>
              Selecciona la Hora
            </ThemedText>
            {loadingSlots ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color={isDark ? Colors.accent : Colors.primary} />
              </View>
            ) : slots.length === 0 ? (
              <View style={styles.emptyBox}>
                <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "center" }}>
                  Esta empresa no tiene horarios disponibles para la fecha elegida.
                </ThemedText>
              </View>
            ) : (
              <View style={styles.timeSlotsContainer}>
                {slots.map((time) => {
                  const isSelected = selectedTime === time;
                  return (
                    <Pressable
                      key={time}
                      onPress={() => handleTimeSelect(time)}
                      style={[
                        styles.timeSlot,
                        {
                          backgroundColor: isSelected
                            ? isDark ? Colors.accent : Colors.primary
                            : theme.backgroundDefault,
                          borderColor: isSelected
                            ? isDark ? Colors.accent : Colors.primary
                            : theme.backgroundTertiary,
                        },
                      ]}
                    >
                      <ThemedText
                        type="body"
                        style={{
                          color: isSelected ? "#FFFFFF" : theme.text,
                          fontWeight: isSelected ? "600" : "400",
                        }}
                      >
                        {time}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </Animated.View>
        ) : null}

        {selectedDate && selectedTime && selectedCompany ? (
          <Animated.View
            entering={FadeInDown.springify()}
            style={[styles.summaryCard, { backgroundColor: theme.backgroundDefault }]}
          >
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              Tu cita
            </ThemedText>
            <ThemedText type="h3">
              {selectedDate.toLocaleDateString("es-MX", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </ThemedText>
            <ThemedText
              type="body"
              style={{ color: isDark ? Colors.accent : Colors.primary }}
            >
              {selectedTime} · {selectedCompany.name}
            </ThemedText>
            {showEstimatedTime ? (
              <View style={styles.estimatedTimeRow}>
                <Feather name="clock" size={14} color={theme.textSecondary} />
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Tiempo estimado: {formatTimeRange(estimatedTime.min, estimatedTime.max)}
                </ThemedText>
              </View>
            ) : null}
          </Animated.View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.backgroundDefault }]}>
        <Pressable
          onPress={handleConfirm}
          disabled={!isReserved}
          style={[
            styles.confirmButton,
            {
              backgroundColor: isReserved
                ? isDark ? Colors.accent : Colors.primary
                : theme.backgroundTertiary,
              opacity: isReserved ? 1 : 0.5,
            },
          ]}
        >
          <ThemedText
            type="body"
            style={{
              color: isReserved ? "#FFFFFF" : theme.textSecondary,
              fontWeight: "700",
              textAlign: "center",
            }}
          >
            Confirmar Horario
          </ThemedText>
        </Pressable>
      </View>
    </View>
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
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  datesContainer: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  dateCard: {
    width: 72,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    borderWidth: 1,
  },
  companiesContainer: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  companyCard: {
    width: 110,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    alignItems: "center",
    gap: Spacing.xs,
  },
  companyLogoWrap: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 2,
  },
  companyLogo: {
    width: "100%",
    height: "100%",
  },
  loadingBox: {
    paddingVertical: Spacing.xl,
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  emptyBox: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  timeSlotsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  timeSlot: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  summaryCard: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  estimatedTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  footer: {
    padding: Spacing.xl,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  confirmButton: {
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
});
