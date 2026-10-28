import React, { useState } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/lib/auth-context";
import { BorderRadius, Colors, Spacing } from "@/constants/theme";
import { AuthStackParamList } from "@/navigation/AuthStackNavigator";

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, "Login">;

export default function LoginScreen() {
  const { theme } = useTheme();
  const { login } = useAuth();
  const navigation = useNavigation<NavigationProp>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError("Ingresá tu correo y contraseña.");
      return;
    }
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Credenciales incorrectas");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: theme.backgroundRoot }]}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brand}>
            <View style={[styles.logo, { backgroundColor: Colors.primary }]}>
              <Ionicons
                name="sparkles"
                size={28}
                color={Colors.light.buttonText}
              />
            </View>
            <ThemedText type="h1" style={styles.title}>
              Car Wash
            </ThemedText>
            <ThemedText
              type="caption"
              style={[styles.subtitle, { color: theme.textSecondary }]}
            >
              Reservá tu lavado en minutos
            </ThemedText>
          </View>

          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.backgroundDefault,
                borderColor: theme.backgroundTertiary,
              },
            ]}
          >
            <View style={styles.field}>
              <ThemedText type="caption" style={styles.label}>
                Correo electrónico
              </ThemedText>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="tu@correo.com"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                autoComplete="username"
                editable={!submitting}
                style={[
                  styles.input,
                  {
                    color: theme.text,
                    borderColor: theme.backgroundTertiary,
                    backgroundColor: theme.backgroundDefault,
                  },
                ]}
              />
            </View>

            <View style={styles.field}>
              <ThemedText type="caption" style={styles.label}>
                Contraseña
              </ThemedText>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
                autoComplete="password"
                editable={!submitting}
                style={[
                  styles.input,
                  {
                    color: theme.text,
                    borderColor: theme.backgroundTertiary,
                    backgroundColor: theme.backgroundDefault,
                  },
                ]}
              />
            </View>

            {error ? (
              <ThemedText
                type="small"
                style={[styles.error, { color: Colors.error }]}
              >
                {error}
              </ThemedText>
            ) : null}

            <Button onPress={onSubmit} disabled={submitting} style={styles.cta}>
              {submitting ? (
                <ActivityIndicator color={Colors.light.buttonText} />
              ) : (
                "Iniciar sesión"
              )}
            </Button>

            <Pressable onPress={() => navigation.navigate("Register")} disabled={submitting}>
              <ThemedText
                type="small"
                style={[styles.linkText, { color: theme.textSecondary }]}
              >
                ¿No tenés cuenta? <ThemedText type="small" style={{ color: Colors.primary, fontWeight: "600" }}>Crear cuenta</ThemedText>
              </ThemedText>
            </Pressable>
          </View>

          <ThemedText
            type="small"
            style={[styles.footer, { color: theme.textSecondary }]}
          >
            ¿Necesitás ayuda? Contactá a soporte
          </ThemedText>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing["3xl"],
    gap: Spacing["2xl"],
  },
  brand: {
    alignItems: "center",
    gap: Spacing.md,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  title: { textAlign: "center", marginTop: Spacing.xs },
  subtitle: { textAlign: "center" },
  card: {
    borderRadius: BorderRadius.sm, // 12 — match shadcn rounded-xl
    borderWidth: 1,
    padding: Spacing.xl,
    gap: Spacing.lg,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  field: { gap: Spacing.xs },
  label: { fontWeight: "600" },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.xs, // 8 — match shadcn input
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
  },
  error: { marginTop: -Spacing.xs },
  cta: { marginTop: Spacing.xs }, // Button base ya matchea shadcn (radius 8, h 40)
  linkText: { textAlign: "center", marginTop: Spacing.sm },
  footer: { textAlign: "center" },
});
