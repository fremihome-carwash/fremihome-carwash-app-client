import React from "react";
import { StyleSheet } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ThemedView } from "@/components/ThemedView";
import { SchedulePicker } from "@/components/SchedulePicker";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "RescheduleBooking">;
type RouteType = RouteProp<RootStackParamList, "RescheduleBooking">;

export default function RescheduleBookingScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { washType, addOns, onConfirm } = route.params;

  const handleConfirm = (
    date: Date,
    time: string,
    reservationExpiry: number,
    company: { id: string; name: string },
  ) => {
    onConfirm(date, time, reservationExpiry, company);
    navigation.goBack();
  };

  return (
    <ThemedView style={styles.container}>
      <SchedulePicker
        washType={washType}
        addOns={addOns}
        onConfirm={handleConfirm}
        showEstimatedTime={false}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
