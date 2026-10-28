import React, { useState } from "react";
import { StyleSheet, View, TextInput, ScrollView } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { SelectField } from "@/components/SelectField";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import {
  SavedAddress,
  saveAddress,
  AVAILABLE_STATES,
  AVAILABLE_CITIES,
  AVAILABLE_COLONIES,
} from "@/lib/storage";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "RegisterAddress">;
type RouteType = RouteProp<RootStackParamList, "RegisterAddress">;

export default function RegisterAddressScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const onSaved = route.params?.onSaved;

  const [alias, setAlias] = useState("");
  const [state, setState] = useState(AVAILABLE_STATES[0]);
  const [city, setCity] = useState(AVAILABLE_CITIES[0]);
  const [colony, setColony] = useState("");
  const [coto, setCoto] = useState("");
  const [street, setStreet] = useState("");
  const [exteriorNumber, setExteriorNumber] = useState("");
  const [interiorNumber, setInteriorNumber] = useState("");
  const [reference, setReference] = useState("");

  const canSave = alias.trim() && state && city && colony && street.trim() && exteriorNumber.trim();

  const handleSave = async () => {
    if (!canSave) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const addr = await saveAddress({
      alias: alias.trim(),
      state,
      city,
      colony,
      coto: coto.trim() || undefined,
      street: street.trim(),
      exteriorNumber: exteriorNumber.trim(),
      interiorNumber: interiorNumber.trim() || undefined,
      reference: reference.trim() || undefined,
    });
    onSaved?.(addr);
    navigation.goBack();
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inputGroup}>
          <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
            Nombre de la dirección
          </ThemedText>
          <TextInput
            value={alias}
            onChangeText={setAlias}
            placeholder="Casa, Oficina, Trabajo..."
            placeholderTextColor={theme.textSecondary + "80"}
            style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.backgroundTertiary }]}
          />
        </View>

        <SelectField
          label="Estado"
          options={AVAILABLE_STATES}
          value={state}
          onChange={setState}
          placeholder="Selecciona un estado"
        />

        <SelectField
          label="Ciudad"
          options={AVAILABLE_CITIES}
          value={city}
          onChange={setCity}
          placeholder="Selecciona una ciudad"
        />

        <SelectField
          label="Fraccionamiento / Colonia"
          options={AVAILABLE_COLONIES}
          value={colony}
          onChange={setColony}
          placeholder="Selecciona una colonia"
        />

        <View style={styles.inputGroup}>
          <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
            Coto (opcional)
          </ThemedText>
          <TextInput
            value={coto}
            onChangeText={setCoto}
            placeholder="Ej: Coto 5"
            placeholderTextColor={theme.textSecondary + "80"}
            style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.backgroundTertiary }]}
          />
        </View>

        <View style={styles.inputGroup}>
          <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
            Calle
          </ThemedText>
          <TextInput
            value={street}
            onChangeText={setStreet}
            placeholder="Av. Paseo de los Robles"
            placeholderTextColor={theme.textSecondary + "80"}
            style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.backgroundTertiary }]}
          />
        </View>

        <View style={styles.numberRow}>
          <View style={styles.numberField}>
            <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
              No. Exterior
            </ThemedText>
            <TextInput
              value={exteriorNumber}
              onChangeText={setExteriorNumber}
              placeholder="123"
              placeholderTextColor={theme.textSecondary + "80"}
              style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.backgroundTertiary }]}
            />
          </View>
          <View style={styles.numberField}>
            <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
              No. Interior (opcional)
            </ThemedText>
            <TextInput
              value={interiorNumber}
              onChangeText={setInteriorNumber}
              placeholder="A"
              placeholderTextColor={theme.textSecondary + "80"}
              style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.backgroundTertiary }]}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
            Referencia (opcional)
          </ThemedText>
          <TextInput
            value={reference}
            onChangeText={setReference}
            placeholder="Portón azul, junto a la farmacia..."
            placeholderTextColor={theme.textSecondary + "80"}
            style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.backgroundTertiary }]}
          />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <Button onPress={handleSave} disabled={!canSave} style={styles.saveButton}>
          Guardar Dirección
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
  numberRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  numberField: {
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
