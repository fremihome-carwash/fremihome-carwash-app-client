import React, { useState, useEffect } from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
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
import { PaymentMethodSelector, PaymentMethodOption } from "@/components/PaymentMethodSelector";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import {
  PACKAGES,
  activateMembership,
  formatPrice,
  getVehicleName,
  VehicleSize,
  fetchPlatformPaymentMethods,
} from "@/lib/storage";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "PackagePurchase">;
type RouteType = RouteProp<RootStackParamList, "PackagePurchase">;

const VEHICLE_IMAGES: Record<VehicleSize, any> = {
  small: vehicleSmall,
  suv: vehicleSuv,
  large: vehicleLarge,
};

export default function PackagePurchaseScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [selectedPayment, setSelectedPayment] = useState<string>("");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodOption[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPlatformPaymentMethods().then((list) => {
      if (cancelled) return;
      setPaymentMethods(list);
      setSelectedPayment((current) => {
        if (current && list.some((m) => m.id === current)) return current;
        return list[0]?.id ?? "";
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const { packageId, durationId, vehicleSize } = route.params;
  const pkg = PACKAGES.find((p) => p.id === packageId);
  const duration = pkg?.durations.find((d) => d.id === durationId);

  if (!pkg || !duration) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="body">Paquete no encontrado</ThemedText>
      </ThemedView>
    );
  }

  const price = duration.prices[vehicleSize];

  const handlePurchase = async () => {
    console.log("[PackagePurchase] handlePurchase start", { packageId: pkg.id, durationId, vehicleSize });
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch {}
    setErrorMsg(null);
    setIsProcessing(true);
    try {
      const result = await activateMembership(pkg.id, durationId, vehicleSize);
      console.log("[PackagePurchase] activate OK", result);
      setSuccess(true);
    } catch (error) {
      console.error("[PackagePurchase] activate FAILED", error);
      setErrorMsg(error instanceof Error ? error.message : "No se pudo procesar el pago. Intenta de nuevo.");
    } finally {
      setIsProcessing(false);
    }
  };

  const goHome = () => {
    console.log("[PackagePurchase] goHome");
    navigation.reset({ index: 0, routes: [{ name: "Main" }] });
  };

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => {
        console.log("[PackagePurchase] auto-navigate to Main");
        navigation.reset({ index: 0, routes: [{ name: "Main" }] });
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [success, navigation]);

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <Card
            elevation={2}
            style={{ ...styles.packageSummary, borderLeftColor: pkg.color }}
          >
            <View style={styles.packageHeader}>
              <View style={[styles.packageIcon, { backgroundColor: pkg.color + "20" }]}>
                <Feather
                  name={pkg.id === "premium" ? "award" : pkg.id === "completo" ? "star" : "check-circle"}
                  size={28}
                  color={pkg.color}
                />
              </View>
              <View style={styles.packageInfo}>
                <ThemedText type="h2">{pkg.name}</ThemedText>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  {duration.washesIncluded} lavadas - {duration.label}
                </ThemedText>
              </View>
            </View>
            <View style={styles.vehicleRow}>
              <Image
                source={VEHICLE_IMAGES[vehicleSize]}
                style={styles.vehicleImageSmall}
                contentFit="contain"
              />
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                {getVehicleName(vehicleSize)}
              </ThemedText>
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Card elevation={1} style={styles.section}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Resumen de Compra
            </ThemedText>
            <View style={styles.summaryRow}>
              <ThemedText type="body">Paquete {pkg.name}</ThemedText>
              <ThemedText type="body">{duration.label}</ThemedText>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                Vehículo
              </ThemedText>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                {getVehicleName(vehicleSize)}
              </ThemedText>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                Lavadas incluidas
              </ThemedText>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                {duration.washesIncluded}
              </ThemedText>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                Impuestos incluidos
              </ThemedText>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                $0.00
              </ThemedText>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <ThemedText type="h3">Total</ThemedText>
              <ThemedText type="h2" style={{ color: pkg.color }}>
                {formatPrice(price)}
              </ThemedText>
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).springify()}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            Método de Pago
          </ThemedText>
          <PaymentMethodSelector
            methods={paymentMethods}
            selectedId={selectedPayment}
            onSelect={setSelectedPayment}
          />
        </Animated.View>

        <View style={styles.footer}>
          <ThemedText type="small" style={{ color: "#888", textAlign: "center" }}>
            debug: processing={String(isProcessing)} success={String(success)} error={errorMsg ?? "none"}
          </ThemedText>
          {success ? (
            <Card elevation={1} style={[styles.successCard, { borderColor: Colors.success + "40" }]}>
              <View style={styles.successHeader}>
                <Feather name="check-circle" size={28} color={Colors.success} />
                <ThemedText type="h3" style={{ color: Colors.success }}>
                  ¡Compra exitosa!
                </ThemedText>
              </View>
              <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
                Tu paquete {pkg.name} ({duration.label}) está activo. Tienes {duration.washesIncluded} lavadas disponibles.
              </ThemedText>
              <Button
                onPress={goHome}
                style={[styles.purchaseButton, { backgroundColor: Colors.success, marginTop: Spacing.md }]}
              >
                Volver al inicio
              </Button>
            </Card>
          ) : (
            <>
              <ThemedText
                type="caption"
                style={[styles.disclaimer, { color: theme.textSecondary }]}
              >
                Al continuar, aceptas los términos de compra. Tu paquete estará
                activo durante {duration.days} días a partir de la compra.
              </ThemedText>
              {errorMsg ? (
                <ThemedText
                  type="caption"
                  style={{ color: Colors.error, textAlign: "center" }}
                >
                  {errorMsg}
                </ThemedText>
              ) : null}
              <Button
                onPress={handlePurchase}
                disabled={isProcessing}
                style={[styles.purchaseButton, { backgroundColor: Colors.success }]}
              >
                {isProcessing ? "Procesando..." : `Pagar ${formatPrice(price)}`}
              </Button>
            </>
          )}
        </View>
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
  content: {
    padding: Spacing.xl,
    gap: Spacing.lg,
    flexGrow: 1,
  },
  packageSummary: {
    borderLeftWidth: 4,
  },
  packageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  packageIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  packageInfo: {
    flex: 1,
  },
  vehicleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  vehicleImageSmall: {
    width: 40,
    height: 28,
  },
  section: {
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
  },
  footer: {
    marginTop: "auto",
    gap: Spacing.md,
  },
  disclaimer: {
    textAlign: "center",
  },
  purchaseButton: {
    marginTop: Spacing.sm,
  },
  successCard: {
    padding: Spacing.lg,
    borderWidth: 1,
  },
  successHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
});
