import React, { useState } from "react";
import { StyleSheet, View, Pressable, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

interface SelectFieldProps {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

export function SelectField({ label, options, value, onChange, placeholder }: SelectFieldProps) {
  const { theme, isDark } = useTheme();
  const [showOptions, setShowOptions] = useState(false);

  return (
    <View>
      <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
        {label}
      </ThemedText>
      <Pressable
        onPress={() => setShowOptions(!showOptions)}
        style={[
          styles.selector,
          {
            backgroundColor: theme.backgroundDefault,
            borderColor: showOptions
              ? isDark ? Colors.accent : Colors.primary
              : theme.backgroundTertiary,
          },
        ]}
      >
        <ThemedText
          type="body"
          style={{
            color: value ? theme.text : theme.textSecondary + "80",
            flex: 1,
          }}
        >
          {value || placeholder}
        </ThemedText>
        <Feather
          name={showOptions ? "chevron-up" : "chevron-down"}
          size={18}
          color={theme.textSecondary}
        />
      </Pressable>
      {showOptions ? (
        <View style={[styles.optionsList, { backgroundColor: theme.backgroundDefault, borderColor: theme.backgroundTertiary }]}>
          {options.map((option) => {
            const isSelected = value === option;
            return (
              <Pressable
                key={option}
                onPress={() => {
                  onChange(option);
                  setShowOptions(false);
                  if (Platform.OS !== "web") Haptics.selectionAsync();
                }}
                style={[
                  styles.option,
                  {
                    backgroundColor: isSelected
                      ? (isDark ? Colors.accent : Colors.primary) + "15"
                      : "transparent",
                  },
                ]}
              >
                <ThemedText
                  type="body"
                  style={{
                    color: isSelected
                      ? isDark ? Colors.accent : Colors.primary
                      : theme.text,
                    fontWeight: isSelected ? "600" : "400",
                  }}
                >
                  {option}
                </ThemedText>
                {isSelected ? (
                  <Feather
                    name="check"
                    size={16}
                    color={isDark ? Colors.accent : Colors.primary}
                  />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  selector: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  optionsList: {
    marginTop: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
});
