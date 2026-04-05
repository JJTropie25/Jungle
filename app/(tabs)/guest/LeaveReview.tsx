import { useMemo, useState } from "react";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "../../../lib/theme";
import { useAuthState } from "../../../lib/auth";
import { submitServiceReview } from "../../../lib/reviews";
import { useAppDialog } from "../../../components/AppDialogProvider";
import { useI18n } from "../../../lib/i18n";

export default function LeaveReview() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dialog = useAppDialog();
  const { t } = useI18n();
  const { user } = useAuthState();
  const { bookingId, serviceId, microservice, destination, timeslot } = useLocalSearchParams<{
    bookingId?: string;
    serviceId?: string;
    microservice?: string;
    destination?: string;
    timeslot?: string;
  }>();

  const [rating, setRating] = useState<number>(8);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const scoreOptions = useMemo(() => Array.from({ length: 11 }, (_, i) => i), []);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)/bookings"))}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.title}>{t("review.title")}</Text>
        <View style={styles.card}>
          <Text style={styles.serviceTitle}>{microservice ?? "-"}</Text>
          <Text style={styles.meta}>{destination ?? "-"}</Text>
          <Text style={styles.meta}>{timeslot ?? "-"}</Text>
        </View>

        <Text style={styles.sectionTitle}>{t("review.scoreLabel")}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scoreRow}
        >
          {scoreOptions.map((value) => (
            <TouchableOpacity
              key={`score-${value}`}
              style={[styles.scoreChip, rating === value && styles.scoreChipSelected]}
              onPress={() => setRating(value)}
            >
              <Text style={[styles.scoreText, rating === value && styles.scoreTextSelected]}>{value}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>{t("review.descriptionLabel")}</Text>
        <TextInput
          style={styles.input}
          placeholder={t("review.placeholder")}
          multiline
          value={description}
          onChangeText={setDescription}
        />

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          disabled={submitting}
          onPress={async () => {
            if (!user?.id || !bookingId || !serviceId) {
              await dialog.alert(t("review.title"), t("review.missingData"));
              return;
            }
            if (!description.trim()) {
              await dialog.alert(t("review.title"), t("review.missingDescription"));
              return;
            }
            setSubmitting(true);
            const error = await submitServiceReview({
              bookingId,
              serviceId,
              guestId: user.id,
              rating10: rating,
              description: description.trim(),
            });
            setSubmitting(false);
            if (error) {
              await dialog.alert(t("review.title"), error);
              return;
            }
            await dialog.alert(t("review.title"), t("review.sent"));
            router.replace("/(tabs)/bookings");
          }}
        >
          <Text style={styles.submitText}>{submitting ? t("review.sending") : t("review.submit")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.screenBackground },
  container: { padding: 16, paddingBottom: 24 },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 12,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 14,
  },
  serviceTitle: {
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  meta: {
    color: colors.textSecondary,
    fontWeight: "600",
    marginBottom: 2,
  },
  sectionTitle: {
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  scoreRow: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 8,
    marginBottom: 14,
  },
  scoreChip: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  scoreChipSelected: {
    backgroundColor: colors.warmSurface,
    borderColor: colors.warmAccent,
  },
  scoreText: {
    color: colors.textSecondary,
    fontWeight: "700",
  },
  scoreTextSelected: {
    color: colors.warmAccentDark,
  },
  input: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.background,
    padding: 12,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: colors.warmAccentDark,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: colors.background,
    fontWeight: "700",
  },
});
