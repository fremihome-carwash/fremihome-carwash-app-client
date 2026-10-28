import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import MainTabNavigator from "@/navigation/MainTabNavigator";
import AuthStackNavigator from "@/navigation/AuthStackNavigator";
import { useAuth } from "@/lib/auth-context";
import { Colors } from "@/constants/theme";
import { loadCatalog } from "@/lib/storage";
import VehicleSelectionScreen from "@/screens/VehicleSelectionScreen";
import ServiceCustomizationScreen from "@/screens/ServiceCustomizationScreen";
import ScheduleSelectionScreen from "@/screens/ScheduleSelectionScreen";
import PaymentScreen from "@/screens/PaymentScreen";
import ConfirmationScreen from "@/screens/ConfirmationScreen";
import AppointmentDetailScreen from "@/screens/AppointmentDetailScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import PackagesScreen from "@/screens/PackagesScreen";
import PackageVehicleSelectionScreen from "@/screens/PackageVehicleSelectionScreen";
import AddressManagementScreen from "@/screens/AddressManagementScreen";
import VehicleManagementScreen from "@/screens/VehicleManagementScreen";
import MembershipDetailScreen from "@/screens/MembershipDetailScreen";
import MembershipPackageDetailScreen from "@/screens/MembershipPackageDetailScreen";
import PackagePurchaseScreen from "@/screens/PackagePurchaseScreen";
import BookingPaymentSelectionScreen from "@/screens/BookingPaymentSelectionScreen";
import BookingPackageOptionScreen from "@/screens/BookingPackageOptionScreen";
import ServiceFeedbackScreen from "@/screens/ServiceFeedbackScreen";
import RegisterVehicleScreen from "@/screens/RegisterVehicleScreen";
import RegisterAddressScreen from "@/screens/RegisterAddressScreen";
import RescheduleBookingScreen from "@/screens/RescheduleBookingScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { VehicleSize, WashType, Booking, SavedVehicle, SavedAddress } from "@/lib/storage";

export type RootStackParamList = {
  Main: undefined;
  BookingPaymentSelection: undefined;
  VehicleSelection: { membershipId?: string } | undefined;
  BookingPackageOption: {
    vehicleSize: VehicleSize;
    addressLabel: string;
    vehicleBrand: string;
    vehicleModel: string;
    vehicleColor: string;
    vehiclePlate?: string;
  };
  ServiceCustomization: {
    vehicleSize: VehicleSize;
    addressLabel: string;
    vehicleBrand: string;
    vehicleModel: string;
    vehicleColor: string;
    vehiclePlate?: string;
  };
  ScheduleSelection: {
    vehicleSize: VehicleSize;
    washType: WashType;
    addOns: string[];
    totalPrice: number;
    addressLabel: string;
    vehicleBrand: string;
    vehicleModel: string;
    vehicleColor: string;
    vehiclePlate?: string;
    comments?: string;
    membershipId?: string;
    packageId?: string;
  };
  Payment: {
    vehicleSize: VehicleSize;
    washType: WashType;
    addOns: string[];
    date: string;
    time: string;
    totalPrice: number;
    reservationExpiry?: number;
    addressLabel: string;
    vehicleBrand: string;
    vehicleModel: string;
    vehicleColor: string;
    vehiclePlate?: string;
    comments?: string;
    membershipId?: string;
    companyId: string;
    companyName: string;
  };
  Confirmation: { booking: Booking };
  AppointmentDetail: { booking: Booking };
  Profile: undefined;
  PackageVehicleSelection: undefined;
  Packages: { vehicleSize: VehicleSize };
  AddressManagement: undefined;
  VehicleManagement: undefined;
  MembershipDetail: undefined;
  MembershipPackageDetail: { membershipId: string };
  PackagePurchase: { packageId: string; durationId: string; vehicleSize: VehicleSize };
  ServiceFeedback: { booking: Booking };
  RegisterVehicle: { onSaved?: (vehicle: SavedVehicle) => void } | undefined;
  RegisterAddress: { onSaved?: (address: SavedAddress) => void } | undefined;
  RescheduleBooking: {
    washType: WashType;
    addOns: string[];
    onConfirm: (
      date: Date,
      time: string,
      reservationExpiry: number,
      company: { id: string; name: string },
    ) => void;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions({ transparent: false });
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!user) {
    return <AuthStackNavigator />;
  }

  return (
    <CatalogGate>
      <AuthenticatedStack screenOptions={screenOptions} />
    </CatalogGate>
  );
}

/**
 * Bloquea la UI hasta que `/api/client/catalog` haya respondido.
 * Una sola llamada por vida de la app (idempotente en `loadCatalog`).
 */
function CatalogGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    loadCatalog()
      .then(() => setReady(true))
      .catch(() => setReady(true)); // si falla, dejamos pasar igual con defaults
  }, []);
  if (!ready) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }
  return <>{children}</>;
}

function AuthenticatedStack({
  screenOptions,
}: {
  screenOptions: ReturnType<typeof useScreenOptions>;
}) {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Main"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BookingPaymentSelection"
        component={BookingPaymentSelectionScreen}
        options={{
          headerTitle: "Método de Pago",
        }}
      />
      <Stack.Screen
        name="VehicleSelection"
        component={VehicleSelectionScreen}
        options={{
          headerTitle: "Selecciona tu Vehículo",
        }}
      />
      <Stack.Screen
        name="BookingPackageOption"
        component={BookingPackageOptionScreen}
        options={{
          headerTitle: "Usar Paquete",
        }}
      />
      <Stack.Screen
        name="ServiceCustomization"
        component={ServiceCustomizationScreen}
        options={{
          headerTitle: "Personaliza tu Lavado",
        }}
      />
      <Stack.Screen
        name="ScheduleSelection"
        component={ScheduleSelectionScreen}
        options={{
          headerTitle: "Elige Horario",
        }}
      />
      <Stack.Screen
        name="Payment"
        component={PaymentScreen}
        options={{
          headerTitle: "Confirmar Pago",
        }}
      />
      <Stack.Screen
        name="Confirmation"
        component={ConfirmationScreen}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="AppointmentDetail"
        component={AppointmentDetailScreen}
        options={{
          headerTitle: "Detalles de Cita",
        }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerTitle: "Mi Perfil",
        }}
      />
      <Stack.Screen
        name="PackageVehicleSelection"
        component={PackageVehicleSelectionScreen}
        options={{
          headerTitle: "Paquetes",
        }}
      />
      <Stack.Screen
        name="Packages"
        component={PackagesScreen}
        options={{
          headerTitle: "Paquetes Disponibles",
        }}
      />
      <Stack.Screen
        name="AddressManagement"
        component={AddressManagementScreen}
        options={{
          headerTitle: "Mi Dirección",
        }}
      />
      <Stack.Screen
        name="VehicleManagement"
        component={VehicleManagementScreen}
        options={{
          headerTitle: "Mis Vehículos",
        }}
      />
      <Stack.Screen
        name="MembershipDetail"
        component={MembershipDetailScreen}
        options={{
          headerTitle: "Mis Paquetes",
        }}
      />
      <Stack.Screen
        name="MembershipPackageDetail"
        component={MembershipPackageDetailScreen}
        options={{
          headerTitle: "Detalle del Paquete",
        }}
      />
      <Stack.Screen
        name="PackagePurchase"
        component={PackagePurchaseScreen}
        options={{
          headerTitle: "Comprar Paquete",
        }}
      />
      <Stack.Screen
        name="ServiceFeedback"
        component={ServiceFeedbackScreen}
        options={{
          headerTitle: "Calificar Servicio",
        }}
      />
      <Stack.Screen
        name="RegisterVehicle"
        component={RegisterVehicleScreen}
        options={{
          headerTitle: "Registrar Vehículo",
        }}
      />
      <Stack.Screen
        name="RegisterAddress"
        component={RegisterAddressScreen}
        options={{
          headerTitle: "Registrar Dirección",
        }}
      />
      <Stack.Screen
        name="RescheduleBooking"
        component={RescheduleBookingScreen}
        options={{
          headerTitle: "Reprogramar Cita",
        }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
