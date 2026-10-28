import React, { useMemo, useState } from "react";
import { StyleSheet, View, TextInput, Pressable, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { SheetSelect } from "@/components/SheetSelect";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { SavedVehicle, VehicleSize, saveVehicle } from "@/lib/storage";
import { VEHICLE_BRANDS_MODELS, VEHICLE_COLORS } from "@/data/vehicle-catalog";

import vehicleSmall from "../../assets/images/vehicle-small.png";
import vehicleSuv from "../../assets/images/vehicle-suv.png";
import vehicleLarge from "../../assets/images/vehicle-large.png";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "RegisterVehicle">;
type RouteType = RouteProp<RootStackParamList, "RegisterVehicle">;

interface VehicleOption {
  size: VehicleSize;
  name: string;
  description: string;
  image: any;
}

const VEHICLE_OPTIONS: VehicleOption[] = [
  { size: "small", name: "Pequeño",   description: "Sedán, Hatchback, Coupé", image: vehicleSmall },
  { size: "suv",   name: "Camioneta", description: "SUV, Crossover, Van",     image: vehicleSuv },
  { size: "large", name: "Grande",    description: "Pickup, Camión, SUV Grande", image: vehicleLarge },
];

const BRAND_OPTIONS = Object.keys(VEHICLE_BRANDS_MODELS)
  .sort()
  .map((b) => ({ value: b, label: b }));

export default function RegisterVehicleScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const onSaved = route.params?.onSaved;

  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");
  const [customColorMode, setCustomColorMode] = useState(false);
  const [plate, setPlate] = useState("");
  const [size, setSize] = useState<VehicleSize>("small");

  const modelOptions = useMemo(() => {
    const models = VEHICLE_BRANDS_MODELS[brand];
    if (!models) return [];
    return models.map((m) => ({ value: m, label: m }));
  }, [brand]);

  const canSave = brand.trim() && model.trim() && color.trim();

  const handleBrandChange = (next: string) => {
    setBrand(next);
    // Si cambió la marca, el modelo seleccionado puede no aplicar — limpiar.
    setModel("");
  };

  const handleSave = async () => {
    if (!canSave) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const vehicle = await saveVehicle({
      brand: brand.trim(),
      model: model.trim(),
      color: color.trim(),
      size,
      plate: plate.trim() || undefined,
    });
    onSaved?.(vehicle);
    navigation.goBack();
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Marca */}
        <View style={styles.inputGroup}>
          <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
            Marca
          </ThemedText>
          <SheetSelect
            value={brand}
            onChange={handleBrandChange}
            options={BRAND_OPTIONS}
            placeholder="Selecciona una marca..."
            title="Marca"
            searchPlaceholder="Buscar marca..."
            allowCustom
            customLabel="Otra marca (escribir)"
          />
        </View>

        {/* Modelo */}
        <View style={styles.inputGroup}>
          <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
            Modelo
          </ThemedText>
          <SheetSelect
            value={model}
            onChange={setModel}
            options={modelOptions}
            placeholder={
              !brand
                ? "Primero selecciona la marca"
                : modelOptions.length === 0
                ? "Marca custom — escribe el modelo"
                : "Selecciona un modelo..."
            }
            title="Modelo"
            searchPlaceholder="Buscar modelo..."
            disabled={!brand && modelOptions.length === 0 && !model}
            allowCustom
            customLabel="Otro modelo (escribir)"
          />
        </View>

        {/* Color: grid de chips */}
        <View style={styles.inputGroup}>
          <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.sm }}>
            Color
          </ThemedText>
          <View style={styles.colorGrid}>
            {VEHICLE_COLORS.map((c) => {
              const isActive = !customColorMode && color === c.name;
              return (
                <Pressable
                  key={c.name}
                  onPress={() => {
                    setColor(c.name);
                    setCustomColorMode(false);
                  }}
                  style={[
                    styles.colorChip,
                    {
                      borderColor: isActive
                        ? isDark
                          ? Colors.accent
                          : Colors.primary
                        : theme.backgroundTertiary,
                      backgroundColor: theme.backgroundDefault,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.colorSwatch,
                      {
                        backgroundColor: c.hex,
                        borderColor: c.border ? theme.backgroundTertiary : c.hex,
                      },
                    ]}
                  />
                  <ThemedText
                    type="small"
                    style={{
                      color: isActive ? (isDark ? Colors.accent : Colors.primary) : theme.text,
                      fontWeight: isActive ? "600" : "400",
                    }}
                  >
                    {c.name}
                  </ThemedText>
                  {isActive && (
                    <Feather
                      name="check"
                      size={12}
                      color={isDark ? Colors.accent : Colors.primary}
                    />
                  )}
                </Pressable>
              );
            })}

            <Pressable
              onPress={() => {
                setCustomColorMode(true);
                // Si el color actual era de la lista, limpiar para que el usuario escriba libremente
                if (VEHICLE_COLORS.some((c) => c.name === color)) setColor("");
              }}
              style={[
                styles.colorChip,
                {
                  borderStyle: "dashed",
                  borderColor: customColorMode
                    ? isDark
                      ? Colors.accent
                      : Colors.primary
                    : theme.backgroundTertiary,
                  backgroundColor: theme.backgroundDefault,
                },
              ]}
            >
              <Feather name="edit-3" size={14} color={theme.textSecondary} />
              <ThemedText type="small" style={{ color: customColorMode ? (isDark ? Colors.accent : Colors.primary) : theme.textSecondary }}>
                Otro
              </ThemedText>
            </Pressable>
          </View>

          {customColorMode && (
            <View style={{ marginTop: Spacing.sm }}>
              <TextInput
                value={color}
                onChangeText={setColor}
                placeholder="Escribe el color..."
                placeholderTextColor={theme.textSecondary + "80"}
                style={[
                  styles.input,
                  { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.backgroundTertiary },
                ]}
                autoFocus
              />
            </View>
          )}
        </View>

        {/* Placa */}
        <View style={styles.inputGroup}>
          <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
            Placa (opcional)
          </ThemedText>
          <TextInput
            value={plate}
            onChangeText={setPlate}
            placeholder="ABC-1234"
            placeholderTextColor={theme.textSecondary + "80"}
            autoCapitalize="characters"
            style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.backgroundTertiary }]}
          />
        </View>

        {/* Tamaño */}
        <View style={styles.inputGroup}>
          <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.sm }}>
            Tamaño del Vehículo
          </ThemedText>
          <View style={styles.sizeCardsContainer}>
            {VEHICLE_OPTIONS.map((opt) => {
              const isActive = size === opt.size;
              return (
                <Pressable
                  key={opt.size}
                  onPress={() => setSize(opt.size)}
                  style={[
                    styles.sizeCard,
                    {
                      backgroundColor: isActive
                        ? isDark
                          ? "rgba(6, 182, 212, 0.15)"
                          : "rgba(30, 64, 175, 0.08)"
                        : theme.backgroundDefault,
                      borderColor: isActive
                        ? isDark
                          ? Colors.accent
                          : Colors.primary
                        : theme.backgroundTertiary,
                    },
                  ]}
                >
                  <Image source={opt.image} style={styles.sizeCardImage} contentFit="contain" />
                  <View style={styles.sizeCardInfo}>
                    <ThemedText type="h3" style={{ fontSize: 15 }}>{opt.name}</ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary, fontSize: 11 }}>
                      {opt.description}
                    </ThemedText>
                  </View>
                  <Feather
                    name={isActive ? "check-circle" : "circle"}
                    size={20}
                    color={isActive ? (isDark ? Colors.accent : Colors.primary) : theme.backgroundTertiary}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <Button onPress={handleSave} disabled={!canSave} style={styles.saveButton}>
          Guardar Vehículo
        </Button>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    gap: Spacing.lg,
  },
  inputGroup: {},
  input: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: 16,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  colorChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
  },
  colorSwatch: {
    width: 18,
    height: 18,
    borderRadius: 999,
    borderWidth: 1,
  },
  sizeCardsContainer: {
    gap: Spacing.sm,
  },
  sizeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
  },
  sizeCardImage: {
    width: 52,
    height: 38,
    marginRight: Spacing.md,
  },
  sizeCardInfo: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
});
