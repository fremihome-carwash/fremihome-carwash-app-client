import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import HomeScreen from "@/screens/HomeScreen";
import AppointmentsScreen from "@/screens/AppointmentsScreen";
import MenuScreen from "@/screens/MenuScreen";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

export type MainTabParamList = {
  HomeTab: undefined;
  AppointmentsTab: undefined;
  BookTab: undefined;
  PackagesTab: undefined;
  MenuTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

function EmptyPlaceholder() {
  return <View />;
}

export default function MainTabNavigator() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{
        tabBarActiveTintColor: isDark ? Colors.accent : Colors.primary,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: Platform.select({
            ios: "transparent",
            android: theme.backgroundDefault,
          }),
          borderTopWidth: 0,
          elevation: 0,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        headerShown: true,
        headerTitleAlign: "left",
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: theme.backgroundDefault,
          borderBottomWidth: Platform.OS === "ios" ? 0 : 1,
          borderBottomColor: theme.backgroundTertiary,
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: "600",
          color: theme.text,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: "Inicio",
          tabBarIcon: ({ color }) => (
            <Feather name="home" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AppointmentsTab"
        component={AppointmentsScreen}
        options={{
          title: "Citas",
          tabBarIcon: ({ color }) => (
            <Feather name="calendar" size={22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="BookTab"
        component={EmptyPlaceholder}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            (navigation as any).navigate("VehicleSelection");
          },
        })}
        options={{
          title: "Reservar",
          tabBarIcon: ({ color }) => (
            <View
              style={[
                styles.centerTab,
                { backgroundColor: isDark ? Colors.accent : Colors.primary },
              ]}
            >
              <Feather name="plus" size={24} color="#FFFFFF" />
            </View>
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tab.Screen
        name="PackagesTab"
        component={EmptyPlaceholder}
        options={{
          title: "Paquetes",
          tabBarIcon: ({ color }) => (
            <Feather name="award" size={22} color={color} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate("PackageVehicleSelection");
          },
        })}
      />
      <Tab.Screen
        name="MenuTab"
        component={MenuScreen}
        options={{
          title: "Menú",
          tabBarIcon: ({ color }) => (
            <Feather name="menu" size={22} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  centerTab: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
