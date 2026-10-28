import React, { useCallback, useState } from "react";
import { StyleSheet, View, TextInput, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { getUserData, saveUserData, UserData } from "@/lib/storage";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();

  const [userData, setUserData] = useState<UserData | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    const data = await getUserData();
    setUserData(data);
    setName(data.name);
    setPhone(data.phone || "");
    setEmail(data.email || "");
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (userData) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const updatedData: UserData = {
        ...userData,
        name: name.trim() || "Usuario",
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
      };
      await saveUserData(updatedData);
      setUserData(updatedData);
      setIsEditing(false);
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.skeleton, { backgroundColor: theme.backgroundSecondary }]} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <Card elevation={1} style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText type="h3">Información Personal</ThemedText>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  if (isEditing) {
                    handleSave();
                  } else {
                    setIsEditing(true);
                  }
                }}
                style={[
                  styles.editButton,
                  { backgroundColor: isDark ? Colors.accent + "30" : Colors.primary + "15" },
                ]}
              >
                <ThemedText
                  type="caption"
                  style={{
                    color: isDark ? Colors.accent : Colors.primary,
                    fontWeight: "600",
                  }}
                >
                  {isEditing ? "Guardar" : "Editar"}
                </ThemedText>
              </Pressable>
            </View>

            {isEditing ? (
              <View style={styles.editForm}>
                <View style={styles.inputGroup}>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    Nombre
                  </ThemedText>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.backgroundDefault,
                        color: theme.text,
                        borderColor: theme.backgroundTertiary,
                      },
                    ]}
                    value={name}
                    onChangeText={setName}
                    placeholder="Tu nombre"
                    placeholderTextColor={theme.textSecondary}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    Teléfono
                  </ThemedText>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.backgroundDefault,
                        color: theme.text,
                        borderColor: theme.backgroundTertiary,
                      },
                    ]}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Tu teléfono"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="phone-pad"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    Correo
                  </ThemedText>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.backgroundDefault,
                        color: theme.text,
                        borderColor: theme.backgroundTertiary,
                      },
                    ]}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="tu@email.com"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>
            ) : (
              <View style={styles.infoDisplay}>
                <View style={styles.infoRow}>
                  <Feather name="user" size={18} color={theme.textSecondary} />
                  <ThemedText type="body">{userData?.name || "Usuario"}</ThemedText>
                </View>
                {phone ? (
                  <View style={styles.infoRow}>
                    <Feather name="phone" size={18} color={theme.textSecondary} />
                    <ThemedText type="body">{phone}</ThemedText>
                  </View>
                ) : null}
                {email ? (
                  <View style={styles.infoRow}>
                    <Feather name="mail" size={18} color={theme.textSecondary} />
                    <ThemedText type="body">{email}</ThemedText>
                  </View>
                ) : null}
              </View>
            )}
          </Card>
        </Animated.View>

        
      </KeyboardAwareScrollViewCompat>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  skeleton: {
    margin: Spacing.xl,
    height: 200,
    borderRadius: BorderRadius.lg,
  },
  section: {
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  editButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  editForm: {
    gap: Spacing.sm,
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    ...Typography.body,
  },
  infoDisplay: {
    gap: Spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
});
