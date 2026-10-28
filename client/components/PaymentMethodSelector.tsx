import React from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

export interface PaymentMethodOption {
  id: string;
  label: string;
  icon: string; // nombre Lucide del backend (CreditCard, Banknote, etc.)
}

// Backend devuelve nombres de íconos Lucide. Mapeamos al subset disponible en
// Feather (lo que ya usa la app). Lo no mapeado cae a "credit-card".
const ICON_MAP: Record<string, keyof typeof Feather.glyphMap> = {
  CreditCard: "credit-card",
  Building2: "home",
  Banknote: "dollar-sign",
  Smartphone: "smartphone",
  Wallet: "briefcase",
};

function feather(icon: string): keyof typeof Feather.glyphMap {
  return ICON_MAP[icon] ?? "credit-card";
}

interface PaymentMethodSelectorProps {
  methods: PaymentMethodOption[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function PaymentMethodSelector({ methods, selectedId, onSelect }: PaymentMethodSelectorProps) {
  const { theme, isDark } = useTheme();

  const handleSelect = (id: string) => {
    Haptics.selectionAsync();
    onSelect(id);
  };

  if (methods.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "center" }}>
          Esta empresa no tiene métodos de pago configurados.
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {methods.map((method) => {
        const isSelected = selectedId === method.id;
        return (
          <Pressable
            key={method.id}
            onPress={() => handleSelect(method.id)}
            style={[
              styles.paymentMethod,
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
                borderWidth: isSelected ? 2 : 1,
              },
            ]}
          >
            <Feather
              name={feather(method.icon)}
              size={24}
              color={
                isSelected
                  ? isDark
                    ? Colors.accent
                    : Colors.primary
                  : theme.textSecondary
              }
            />
            <View style={styles.paymentInfo}>
              <ThemedText type="body" style={{ fontWeight: "500" }}>
                {method.label}
              </ThemedText>
            </View>
            {isSelected ? (
              <Feather
                name="check-circle"
                size={20}
                color={isDark ? Colors.accent : Colors.primary}
              />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  paymentMethod: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  paymentInfo: {
    flex: 1,
    gap: 2,
  },
  emptyBox: {
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
});
