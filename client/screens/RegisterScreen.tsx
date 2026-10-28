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

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, "Register">;

export default function RegisterScreen() {
  const { theme } = useTheme();
  const { register } = useAuth();
  const navigation = useNavigation<NavigationProp>();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    if (!name.trim() || !email.trim() || !password) {
      setError("Completá nombre, correo y contraseña.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear la cuenta.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.backgroundRoot }]}>
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
              <Ionicons name="sparkles" size={28} color={Colors.light.buttonText} />
            </View>
            <ThemedText type="h1" style={styles.title}>
              Crear cuenta
            </ThemedText>
            <ThemedText
              type="caption"
              style={[styles.subtitle, { color: theme.textSecondary }]}
            >
              Registrate para reservar tu primer lavado
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
                Nombre completo
              </ThemedText>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Tu nombre"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="words"
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
                Correo electrónico
              </ThemedText>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="tu@correo.com"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
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
                Teléfono (opcional)
              </ThemedText>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="5512345678"
                placeholderTextColor={theme.textSecondary}
                keyboardType="phone-pad"
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
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
                autoComplete="new-password"
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
                Confirmar contraseña
              </ThemedText>
              <TextInput
                value={confirm}
                onChangeText={setConfirm}
                placeholder="Repetí la contraseña"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
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
                "Crear cuenta"
              )}
            </Button>

            <Pressable onPress={() => navigation.navigate("Login")} disabled={submitting}>
              <ThemedText
                type="small"
                style={[styles.linkText, { color: theme.textSecondary }]}
              >
                ¿Ya tenés cuenta? <ThemedText type="small" style={{ color: Colors.primary, fontWeight: "600" }}>Iniciar sesión</ThemedText>
              </ThemedText>
            </Pressable>
          </View>
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
    borderRadius: BorderRadius.sm,
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
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
  },
  error: { marginTop: -Spacing.xs },
  cta: { marginTop: Spacing.xs },
  linkText: { textAlign: "center", marginTop: Spacing.sm },
});
