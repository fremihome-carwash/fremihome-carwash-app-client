import React from "react";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ThemedView } from "@/components/ThemedView";
import { SchedulePicker } from "@/components/SchedulePicker";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, "ScheduleSelection">;

export default function ScheduleSelectionScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();

  const { vehicleSize, washType, addOns, totalPrice, addressLabel, vehicleBrand, vehicleModel, vehicleColor, vehiclePlate, comments, membershipId, packageId } = route.params;

  const toLocalDateIso = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  };

  const handleConfirm = (
    selectedDate: Date,
    selectedTime: string,
    reservationExpiry: number,
    company: { id: string; name: string },
  ) => {
    navigation.navigate("Payment", {
      vehicleSize,
      washType,
      addOns,
      date: toLocalDateIso(selectedDate),
      time: selectedTime,
      totalPrice,
      reservationExpiry,
      addressLabel,
      vehicleBrand,
      vehicleModel,
      vehicleColor,
      vehiclePlate,
      comments,
      membershipId,
      companyId: company.id,
      companyName: company.name,
    });
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <SchedulePicker
        washType={washType}
        addOns={addOns}
        packageId={packageId}
        onConfirm={handleConfirm}
        showEstimatedTime={true}
      />
    </ThemedView>
  );
}
