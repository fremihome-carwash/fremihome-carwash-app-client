import React from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInDown, ZoomIn } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import {
  formatDate,
  formatPrice,
  getVehicleName,
  getWashTypeName,
} from "@/lib/storage";

import successDroplet from "../../assets/images/success-droplet.png";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, "Confirmation">;

export default function ConfirmationScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const { booking } = route.params;

  const handleViewAppointments = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.reset({
      index: 0,
      routes: [{ name: "Main" }],
    });
  };

  const handleGoHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "Main" }],
    });
  };

  return (
    <ThemedView
      style={[
        styles.container,
        { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl },
      ]}
    >
      <View style={styles.content}>
        <Animated.View entering={ZoomIn.delay(100).springify()}>
          <Image
            source={successDroplet}
            style={styles.successImage}
            contentFit="contain"
          />
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(200).springify()}
          style={styles.messageContainer}
        >
          <ThemedText
            type="display"
            style={[styles.title, { color: Colors.success }]}
          >
            Reserva Confirmada
          </ThemedText>
          <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
            Tu cita ha sido agendada exitosamente
          </ThemedText>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(300).springify()}
          style={styles.cardContainer}
        >
          <Card elevation={1} style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Vehículo
              </ThemedText>
              <ThemedText type="body">
                {getVehicleName(booking.vehicleSize)}
              </ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Servicio
              </ThemedText>
              <ThemedText type="body">
                {getWashTypeName(booking.washType)}
              </ThemedText>
            </View>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Fecha
              </ThemedText>
              <ThemedText type="body">{formatDate(booking.date)}</ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Hora
              </ThemedText>
              <ThemedText type="body">{booking.time}</ThemedText>
            </View>
            <View style={styles.divider} />
            {booking.usedMembership ? (
              <View style={styles.detailRow}>
                <ThemedText type="body" style={{ color: theme.textSecondary }}>
                  Pago
                </ThemedText>
                <ThemedText type="body" style={{ color: Colors.success, fontWeight: "600" }}>
                  Incluido en paquete
                </ThemedText>
              </View>
            ) : (
              <View style={styles.detailRow}>
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
      </View>

      <Animated.View
        entering={FadeIn.delay(400)}
        style={styles.buttonsContainer}
      >
        <Button onPress={handleViewAppointments} style={styles.primaryButton}>
          Ver Mis Citas
        </Button>
        <Button
          onPress={handleGoHome}
          style={[styles.secondaryButton, { backgroundColor: theme.backgroundSecondary }]}
        >
          Volver al Inicio
        </Button>
      </Animated.View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  successImage: {
    width: 120,
    height: 120,
    marginBottom: Spacing.xl,
  },
  messageContainer: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    textAlign: "center",
  },
  cardContainer: {
    width: "100%",
  },
  detailsCard: {
    width: "100%",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(128, 128, 128, 0.2)",
    marginVertical: Spacing.md,
  },
  buttonsContainer: {
    gap: Spacing.md,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  secondaryButton: {
    backgroundColor: "transparent",
  },
});
