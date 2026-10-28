import React, { useState, useMemo } from "react";
import { StyleSheet, View, Pressable, ScrollView, TextInput } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
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
  WashType,
  ALL_SERVICES,
  WASH_OFFERINGS,
  WashOffering,
  formatPrice,
} from "@/lib/storage";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, "ServiceCustomization">;

/**
 * Calcula el precio final del tipo de lavado para un tamaño de vehículo:
 *   total = basePrice + Σ (service.price + service.sizeModifiers[size]) − descuento
 */
function washOfferingPrice(w: WashOffering, vehicleSizeSlug: string): number {
  const sumServices = w.services.reduce(
    (acc, s) => acc + s.price + (s.sizeModifiers?.[vehicleSizeSlug] ?? 0),
    0,
  );
  const subtotal = w.basePrice + sumServices;
  const discount = Math.min(
    subtotal,
    subtotal * (w.discountPct / 100) + w.discountAmount,
  );
  return Math.max(0, subtotal - discount);
}

export default function ServiceCustomizationScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const { vehicleSize, addressLabel, vehicleBrand, vehicleModel, vehicleColor, vehiclePlate } = route.params;

  // Selección por id del wash offering (modelo nuevo). El primer offering del API es el default.
  const [selectedOfferingId, setSelectedOfferingId] = useState<string>(
    WASH_OFFERINGS[0]?.id ?? "",
  );
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [comments, setComments] = useState("");

  const selectedOffering = useMemo(
    () => WASH_OFFERINGS.find((w) => w.id === selectedOfferingId),
    [selectedOfferingId],
  );

  // Servicios incluidos en el wash type seleccionado (sus ids).
  const includedServiceIds = useMemo(
    () => (selectedOffering?.services ?? []).map((s) => s.id),
    [selectedOffering],
  );

  const totalPrice = useMemo(() => {
    if (!selectedOffering) return 0;
    const washPrice = washOfferingPrice(selectedOffering, vehicleSize);
    const addOnsPrice = selectedAddOns.reduce((sum, id) => {
      const service = ALL_SERVICES.find((s) => s.id === id);
      if (service && !includedServiceIds.includes(id)) {
        return sum + service.price;
      }
      return sum;
    }, 0);
    return washPrice + addOnsPrice;
  }, [vehicleSize, selectedOffering, selectedAddOns, includedServiceIds]);

  const toggleAddOn = (id: string) => {
    if (includedServiceIds.includes(id)) return;
    Haptics.selectionAsync();
    setSelectedAddOns((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleWashTypeChange = (id: string) => {
    Haptics.selectionAsync();
    setSelectedOfferingId(id);
    // Limpiar add-ons que ya estén incluidos en el nuevo wash type
    const nextOffering = WASH_OFFERINGS.find((w) => w.id === id);
    const newIncluded = (nextOffering?.services ?? []).map((s) => s.id);
    setSelectedAddOns((prev) => prev.filter((aid) => !newIncluded.includes(aid)));
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const allSelected = [...includedServiceIds, ...selectedAddOns];
    // El siguiente screen espera `washType` como string — pasamos el id del offering;
    // si el backend de bookings necesita slug, en su lugar pasar selectedOffering?.slug.
    navigation.navigate("ScheduleSelection", {
      vehicleSize,
      washType: (selectedOffering?.slug ?? selectedOfferingId) as WashType,
      addOns: allSelected,
      totalPrice,
      addressLabel,
      vehicleBrand,
      vehicleModel,
      vehicleColor,
      vehiclePlate,
      comments: comments.trim() || undefined,
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
            Tipo de Lavado
          </ThemedText>
          {WASH_OFFERINGS.length === 0 ? (
            <View style={{ paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md }}>
              <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "center" }}>
                No hay tipos de lavado disponibles. Vuelve más tarde.
              </ThemedText>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.washTypeScroll}
            >
              {WASH_OFFERINGS.map((option) => {
                const isSelected = selectedOfferingId === option.id;
                const price = washOfferingPrice(option, vehicleSize);
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => handleWashTypeChange(option.id)}
                    style={[
                      styles.washTypeCard,
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
                          : theme.backgroundTertiary,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.washTypeIcon,
                        {
                          backgroundColor: isSelected
                            ? isDark
                              ? Colors.accent + "25"
                              : Colors.primary + "15"
                            : theme.backgroundTertiary,
                        },
                      ]}
                    >
                      <Feather
                        name="droplet"
                        size={22}
                        color={
                          isSelected
                            ? isDark
                              ? Colors.accent
                              : Colors.primary
                            : theme.textSecondary
                        }
                      />
                    </View>
                    <ThemedText
                      type="h3"
                      style={{
                        color: isSelected
                          ? isDark
                            ? Colors.accent
                            : Colors.primary
                          : theme.text,
                        textAlign: "center",
                      }}
                    >
                      {option.name}
                    </ThemedText>
                    {option.description && (
                      <ThemedText
                        type="small"
                        style={{
                          color: theme.textSecondary,
                          textAlign: "center",
                        }}
                        numberOfLines={2}
                      >
                        {option.description}
                      </ThemedText>
                    )}
                    <ThemedText
                      type="body"
                      style={{
                        color: Colors.success,
                        marginTop: Spacing.xs,
                        fontWeight: "700",
                      }}
                    >
                      {formatPrice(price)}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <ThemedText type="h2" style={styles.sectionTitle}>
            Servicios
          </ThemedText>
          <View style={styles.addOnsContainer}>
            {ALL_SERVICES.map((service) => {
              const isIncluded = includedServiceIds.includes(service.id);
              const isSelected = isIncluded || selectedAddOns.includes(service.id);
              return (
                <Pressable
                  key={service.id}
                  onPress={() => toggleAddOn(service.id)}
                  disabled={isIncluded}
                  style={[
                    styles.addOnItem,
                    {
                      backgroundColor: isSelected
                        ? isDark
                          ? "rgba(6, 182, 212, 0.15)"
                          : "rgba(30, 64, 175, 0.08)"
                        : theme.backgroundDefault,
                    },
                  ]}
                >
                  {isIncluded ? (
                    <Feather name="check-circle" size={22} color={Colors.success} />
                  ) : (
                    <View
                      style={[
                        styles.checkbox,
                        {
                          backgroundColor: isSelected
                            ? isDark
                              ? Colors.accent
                              : Colors.primary
                            : "transparent",
                          borderColor: isSelected
                            ? isDark
                              ? Colors.accent
                              : Colors.primary
                            : theme.textSecondary,
                        },
                      ]}
                    >
                      {isSelected ? (
                        <Feather name="check" size={14} color="#FFFFFF" />
                      ) : null}
                    </View>
                  )}
                  <ThemedText type="body" style={styles.addOnName}>
                    {service.name}
                  </ThemedText>
                  {isIncluded ? (
                    <View style={[styles.includedBadge, { backgroundColor: Colors.success + "20" }]}>
                      <ThemedText
                        type="small"
                        style={{ color: Colors.success, fontWeight: "600" }}
                      >
                        $0
                      </ThemedText>
                    </View>
                  ) : (
                    <ThemedText
                      type="body"
                      style={{ color: isDark ? Colors.accent : Colors.primary }}
                    >
                      +{formatPrice(service.price)}
                    </ThemedText>
                  )}
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.commentsSection}>
          <ThemedText type="h2" style={styles.sectionTitle}>
            Indicaciones o Comentarios
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.sm, paddingHorizontal: Spacing.xl }}>
            Agrega cualquier instrucción especial para el servicio
          </ThemedText>
          <View style={{ paddingHorizontal: Spacing.xl }}>
            <TextInput
              value={comments}
              onChangeText={setComments}
              placeholder="Ej: El carro tiene una abolladura en la puerta derecha, favor de tener cuidado..."
              placeholderTextColor={theme.textSecondary + "60"}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={[
                styles.commentsInput,
                {
                  backgroundColor: theme.backgroundDefault,
                  color: theme.text,
                  borderColor: theme.backgroundTertiary,
                },
              ]}
            />
          </View>
        </Animated.View>

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
        <View style={styles.priceRow}>
          <ThemedText type="body" style={{ color: theme.textSecondary }}>
            Total
          </ThemedText>
          <ThemedText
            type="h1"
            style={{ color: isDark ? Colors.accent : Colors.primary }}
          >
            {formatPrice(totalPrice)}
          </ThemedText>
        </View>
        <Button onPress={handleContinue} style={styles.continueButton}>
          Elegir Horario
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
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  washTypeScroll: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  washTypeCard: {
    width: 130,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    alignItems: "center",
    gap: Spacing.xs,
  },
  washTypeIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  addOnsContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  addOnItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  addOnName: {
    flex: 1,
  },
  includedBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  commentsSection: {
    marginBottom: Spacing.md,
  },
  commentsInput: {
    minHeight: 100,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  footer: {
    padding: Spacing.xl,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  continueButton: {
    backgroundColor: Colors.primary,
  },
});
