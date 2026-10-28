import React, { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";

export interface SheetSelectOption {
  value: string;
  label: string;
  subtitle?: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: SheetSelectOption[];
  /** Texto del trigger cuando no hay valor. */
  placeholder?: string;
  /** Título del sheet. Si no se pasa, usa placeholder. */
  title?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  /** Habilita opción "Otra (escribir)" al final. Default: false. */
  allowCustom?: boolean;
  /** Etiqueta de la opción libre. Default: "Otra". */
  customLabel?: string;
}

/**
 * RN: bottom sheet con lista scroleable y búsqueda. Equivalente a cw_platf/cw_cmp SheetSelect.
 * Regla #4: todos los selects en mobile son bottom sheets.
 */
export function SheetSelect({
  value,
  onChange,
  options,
  placeholder = "Selecciona...",
  title,
  searchPlaceholder = "Buscar...",
  disabled = false,
  allowCustom = false,
  customLabel = "Otra (escribir)",
}: Props) {
  const { theme, isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [customInput, setCustomInput] = useState("");
  const [customMode, setCustomMode] = useState(false);

  const selected = options.find((o) => o.value === value);
  const triggerLabel = selected?.label ?? (value && !options.some((o) => o.value === value) ? value : placeholder);
  const isPlaceholder = !value;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.subtitle?.toLowerCase().includes(q) ?? false),
    );
  }, [options, query]);

  const close = () => {
    setOpen(false);
    setQuery("");
    setCustomMode(false);
    setCustomInput("");
  };

  const selectValue = (v: string) => {
    onChange(v);
    close();
  };

  return (
    <>
      <Pressable
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[
          styles.trigger,
          {
            backgroundColor: theme.backgroundDefault,
            borderColor: theme.backgroundTertiary,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        <ThemedText
          type="body"
          style={{ color: isPlaceholder ? theme.textSecondary + "BB" : theme.text, flex: 1 }}
          numberOfLines={1}
        >
          {triggerLabel}
        </ThemedText>
        <Feather name="chevron-down" size={18} color={theme.textSecondary} />
      </Pressable>

      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={close}
      >
        <Pressable style={styles.backdrop} onPress={close}>
          <Pressable
            style={[
              styles.sheet,
              { backgroundColor: theme.backgroundDefault },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View style={styles.sheetHeader}>
              <ThemedText type="h2">{title ?? placeholder}</ThemedText>
              <Pressable onPress={close} hitSlop={8}>
                <Feather name="x" size={22} color={theme.textSecondary} />
              </Pressable>
            </View>

            {!customMode ? (
              <>
                {/* Search */}
                <View
                  style={[
                    styles.searchBox,
                    {
                      backgroundColor: theme.backgroundSecondary,
                      borderColor: theme.backgroundTertiary,
                    },
                  ]}
                >
                  <Feather name="search" size={16} color={theme.textSecondary} />
                  <TextInput
                    autoFocus
                    value={query}
                    onChangeText={setQuery}
                    placeholder={searchPlaceholder}
                    placeholderTextColor={theme.textSecondary + "AA"}
                    style={[styles.searchInput, { color: theme.text }]}
                  />
                </View>

                {/* Lista */}
                <ScrollView
                  style={styles.list}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  {filtered.length === 0 && (
                    <ThemedText
                      type="small"
                      style={{ color: theme.textSecondary, textAlign: "center", paddingVertical: Spacing.lg }}
                    >
                      Sin resultados
                    </ThemedText>
                  )}
                  {filtered.map((o) => {
                    const isSelected = o.value === value;
                    return (
                      <Pressable
                        key={o.value}
                        onPress={() => selectValue(o.value)}
                        style={[
                          styles.row,
                          isSelected && {
                            backgroundColor: isDark
                              ? "rgba(6, 182, 212, 0.15)"
                              : "rgba(30, 64, 175, 0.08)",
                          },
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <ThemedText
                            type="body"
                            style={{
                              color: isSelected
                                ? isDark
                                  ? Colors.accent
                                  : Colors.primary
                                : theme.text,
                              fontWeight: isSelected ? "600" : "400",
                            }}
                          >
                            {o.label}
                          </ThemedText>
                          {o.subtitle && (
                            <ThemedText type="small" style={{ color: theme.textSecondary }}>
                              {o.subtitle}
                            </ThemedText>
                          )}
                        </View>
                        {isSelected && (
                          <Feather
                            name="check"
                            size={18}
                            color={isDark ? Colors.accent : Colors.primary}
                          />
                        )}
                      </Pressable>
                    );
                  })}

                  {allowCustom && (
                    <Pressable
                      onPress={() => {
                        setCustomMode(true);
                        setCustomInput(value && !options.some((o) => o.value === value) ? value : "");
                      }}
                      style={[styles.row, { borderTopWidth: 1, borderTopColor: theme.backgroundTertiary, marginTop: Spacing.sm }]}
                    >
                      <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: Spacing.sm }}>
                        <Feather name="edit-3" size={16} color={theme.textSecondary} />
                        <ThemedText type="body" style={{ color: theme.textSecondary }}>
                          {customLabel}
                        </ThemedText>
                      </View>
                    </Pressable>
                  )}
                </ScrollView>
              </>
            ) : (
              <>
                {/* Modo custom: input libre */}
                <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
                  Escribe el valor manualmente
                </ThemedText>
                <TextInput
                  autoFocus
                  value={customInput}
                  onChangeText={setCustomInput}
                  placeholder="Escribe aquí..."
                  placeholderTextColor={theme.textSecondary + "AA"}
                  style={[
                    styles.customInput,
                    {
                      backgroundColor: theme.backgroundSecondary,
                      borderColor: theme.backgroundTertiary,
                      color: theme.text,
                    },
                  ]}
                />
                <View style={styles.customActions}>
                  <Pressable
                    onPress={() => setCustomMode(false)}
                    style={[styles.actionBtn, { borderColor: theme.backgroundTertiary }]}
                  >
                    <ThemedText type="body">Atrás</ThemedText>
                  </Pressable>
                  <Pressable
                    disabled={!customInput.trim()}
                    onPress={() => selectValue(customInput.trim())}
                    style={[
                      styles.actionBtn,
                      {
                        backgroundColor: customInput.trim()
                          ? isDark
                            ? Colors.accent
                            : Colors.primary
                          : theme.backgroundTertiary,
                        borderColor: customInput.trim()
                          ? isDark
                            ? Colors.accent
                            : Colors.primary
                          : theme.backgroundTertiary,
                      },
                    ]}
                  >
                    <ThemedText type="body" style={{ color: "#fff" }}>
                      Usar
                    </ThemedText>
                  </Pressable>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    height: "80%",
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  list: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  customInput: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: Spacing.md,
  },
  customActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: "center",
  },
});
