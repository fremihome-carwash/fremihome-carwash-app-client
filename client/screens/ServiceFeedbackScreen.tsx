import React, { useState } from "react";
import { StyleSheet, View, Pressable, TextInput, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { updateBooking, Booking } from "@/lib/storage";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, "ServiceFeedback">;

const RATING_OPTIONS = [1, 2, 3, 4, 5];

const CLEANLINESS_OPTIONS = [
  { id: "excelente", label: "Excelente" },
  { id: "buena", label: "Buena" },
  { id: "regular", label: "Regular" },
  { id: "mala", label: "Mala" },
];

const PUNCTUALITY_OPTIONS = [
  { id: "a_tiempo", label: "A tiempo" },
  { id: "leve_retraso", label: "Leve retraso" },
  { id: "retraso", label: "Con retraso" },
];

const EXTRAS_OPTIONS = [
  { id: "amabilidad", label: "Amabilidad del personal" },
  { id: "productos", label: "Buenos productos" },
  { id: "rapidez", label: "Rapidez del servicio" },
  { id: "detallado", label: "Trabajo detallado" },
  { id: "recomendaria", label: "Lo recomendaría" },
];

export default function ServiceFeedbackScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const { booking } = route.params;

  const [rating, setRating] = useState<number | null>(null);
  const [cleanliness, setCleanliness] = useState<string | null>(null);
  const [punctuality, setPunctuality] = useState<string | null>(null);
  const [extras, setExtras] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const accentColor = isDark ? Colors.accent : Colors.primary;

  const toggleExtra = (id: string) => {
    setExtras((prev) =>
      prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!rating) {
      Alert.alert("Calificación requerida", "Por favor selecciona una calificación general.");
      return;
    }

    setIsSubmitting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const updatedBooking: Booking = {
      ...booking,
      status: "completed",
      feedbackRating: rating,
      feedbackCleanliness: cleanliness || undefined,
      feedbackPunctuality: punctuality || undefined,
      feedbackExtras: extras.length > 0 ? extras : undefined,
      feedbackComment: comment.trim() || undefined,
    };
    try {
      await updateBooking(updatedBooking);
    } finally {
      setIsSubmitting(false);
      // En Expo Web `Alert.alert(...).onPress` no siempre dispara, así que
      // navegamos directo. El detalle de la cita refresca con la reseña al volver.
      navigation.popToTop();
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing["2xl"] },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <Card elevation={1} style={styles.section}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Calificación General
            </ThemedText>
            <ThemedText type="small" style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
              Selecciona una estrella
            </ThemedText>
            <View style={styles.ratingRow}>
              {RATING_OPTIONS.map((star) => (
                <Pressable
                  key={star}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setRating(star);
                  }}
                  style={styles.starButton}
                >
                  <Feather
                    name="star"
                    size={36}
                    color={rating !== null && star <= rating ? Colors.warning : theme.textSecondary + "40"}
                  />
                </Pressable>
              ))}
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Card elevation={1} style={styles.section}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Limpieza del vehículo
            </ThemedText>
            <View style={styles.optionsGrid}>
              {CLEANLINESS_OPTIONS.map((option) => {
                const selected = cleanliness === option.id;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setCleanliness(option.id);
                    }}
                    style={[
                      styles.optionChip,
                      {
                        backgroundColor: selected ? accentColor + "20" : theme.backgroundSecondary,
                        borderColor: selected ? accentColor : "transparent",
                      },
                    ]}
                  >
                    <ThemedText
                      type="body"
                      style={{
                        color: selected ? accentColor : theme.text,
                        fontWeight: selected ? "700" : "400",
                      }}
                    >
                      {option.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).springify()}>
          <Card elevation={1} style={styles.section}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Puntualidad
            </ThemedText>
            <View style={styles.optionsGrid}>
              {PUNCTUALITY_OPTIONS.map((option) => {
                const selected = punctuality === option.id;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setPunctuality(option.id);
                    }}
                    style={[
                      styles.optionChip,
                      {
                        backgroundColor: selected ? accentColor + "20" : theme.backgroundSecondary,
                        borderColor: selected ? accentColor : "transparent",
                      },
                    ]}
                  >
                    <ThemedText
                      type="body"
                      style={{
                        color: selected ? accentColor : theme.text,
                        fontWeight: selected ? "700" : "400",
                      }}
                    >
                      {option.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Card elevation={1} style={styles.section}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Aspectos destacados
            </ThemedText>
            <ThemedText type="small" style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
              Puedes seleccionar varios
            </ThemedText>
            <View style={styles.optionsGrid}>
              {EXTRAS_OPTIONS.map((option) => {
                const selected = extras.includes(option.id);
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      toggleExtra(option.id);
                    }}
                    style={[
                      styles.optionChip,
                      {
                        backgroundColor: selected ? accentColor + "20" : theme.backgroundSecondary,
                        borderColor: selected ? accentColor : "transparent",
                      },
                    ]}
                  >
                    {selected ? (
                      <Feather name="check" size={14} color={accentColor} />
                    ) : null}
                    <ThemedText
                      type="body"
                      style={{
                        color: selected ? accentColor : theme.text,
                        fontWeight: selected ? "700" : "400",
                      }}
                    >
                      {option.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(250).springify()}>
          <Card elevation={1} style={styles.section}>
            <ThemedText type="h3" style={styles.sectionTitle}>
              Comentarios adicionales
            </ThemedText>
            <TextInput
              style={[
                styles.commentInput,
                {
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                  borderColor: theme.backgroundTertiary,
                },
              ]}
              value={comment}
              onChangeText={setComment}
              placeholder="Cuéntanos tu experiencia..."
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <Button
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={[styles.submitButton, { backgroundColor: isDark ? Colors.accent : Colors.primary }]}
            textColor="#FFFFFF"
          >
            {isSubmitting ? "Enviando..." : "Enviar Comentarios"}
          </Button>
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
    gap: Spacing.md,
  },
  section: {
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    marginBottom: Spacing.md,
  },
  ratingRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  starButton: {
    padding: Spacing.xs,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  optionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
  },
  commentInput: {
    minHeight: 100,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    marginTop: Spacing.sm,
    ...Typography.body,
  },
  submitButton: {
    marginTop: Spacing.md,
  },
});
