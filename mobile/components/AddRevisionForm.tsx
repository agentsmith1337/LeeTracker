import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { createRevision } from "@/lib/api";
import { CATEGORY_META } from "@/lib/categories";
import { todayString, toDateString } from "@/lib/dates";
import { detectPlatform, extractProblemName } from "@/lib/extractProblemName";
import type { Revision, RevisionCategory } from "@/lib/types";

const CATEGORIES: RevisionCategory[] = ["CODING", "RIDDLE", "QUANT"];

function parseDateString(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function AddRevisionForm({
  token,
  onAdded,
}: {
  token: string;
  onAdded: (revision: Revision) => void;
}) {
  const [category, setCategory] = useState<RevisionCategory>("CODING");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [revisionDate, setRevisionDate] = useState(todayString());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const previewName =
    category === "CODING" && url.trim()
      ? title.trim() || extractProblemName(url.trim())
      : "";

  const resetForm = () => {
    setUrl("");
    setTitle("");
    setRevisionDate(todayString());
    setError("");
  };

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);

    try {
      if (!revisionDate) {
        throw new Error("Please pick a revision date.");
      }

      if (category === "CODING") {
        const trimmedUrl = url.trim();
        if (!trimmedUrl) throw new Error("Please enter a problem URL.");
        new URL(trimmedUrl);

        const revision = await createRevision(token, {
          category,
          title: title.trim() || extractProblemName(trimmedUrl),
          url: trimmedUrl,
          platform: detectPlatform(trimmedUrl),
          revisionDate,
        });
        onAdded(revision);
      } else {
        const trimmedTitle = title.trim();
        if (!trimmedTitle) throw new Error("Please enter a title.");

        const trimmedUrl = url.trim();
        if (trimmedUrl) new URL(trimmedUrl);

        const revision = await createRevision(token, {
          category,
          title: trimmedTitle,
          url: trimmedUrl || undefined,
          revisionDate,
        });
        onAdded(revision);
      }

      resetForm();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to add revision.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Add revision</Text>

      <View style={styles.categoryRow}>
        {CATEGORIES.map((item) => (
          <Pressable
            key={item}
            style={[
              styles.categoryButton,
              category === item && styles.categoryButtonActive,
            ]}
            onPress={() => {
              setCategory(item);
              setError("");
            }}
          >
            <Text
              style={[
                styles.categoryButtonText,
                category === item && styles.categoryButtonTextActive,
              ]}
            >
              {CATEGORY_META[item].label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.hint}>{CATEGORY_META[category].formTitle}</Text>

      {category === "CODING" ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Problem URL (LeetCode, GFG, etc.)"
            placeholderTextColor="#9ca3af"
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {previewName ? (
            <Text style={styles.preview}>Detected: {previewName}</Text>
          ) : null}
          <TextInput
            style={styles.input}
            placeholder="Name override (optional)"
            placeholderTextColor="#9ca3af"
            value={title}
            onChangeText={setTitle}
          />
        </>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="Title"
            placeholderTextColor="#9ca3af"
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={styles.input}
            placeholder="Link (optional)"
            placeholderTextColor="#9ca3af"
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </>
      )}

      <Pressable
        style={styles.dateButton}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={styles.dateLabel}>Revision date</Text>
        <Text style={styles.dateValue}>{revisionDate}</Text>
      </Pressable>

      {showDatePicker ? (
        <DateTimePicker
          value={parseDateString(revisionDate)}
          mode="date"
          minimumDate={parseDateString(todayString())}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(_event, date) => {
            setShowDatePicker(Platform.OS === "ios");
            if (date) setRevisionDate(toDateString(date));
          }}
        />
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.submitButton, submitting && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>Add to tracker</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    marginBottom: 20,
  },
  heading: { fontSize: 18, fontWeight: "700", color: "#18181b", marginBottom: 12 },
  categoryRow: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#f4f4f5",
    borderRadius: 12,
    padding: 4,
    marginBottom: 10,
  },
  categoryButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
  categoryButtonActive: {
    backgroundColor: "#fff",
  },
  categoryButtonText: { fontSize: 12, fontWeight: "600", color: "#71717a" },
  categoryButtonTextActive: { color: "#18181b" },
  hint: { fontSize: 13, color: "#71717a", marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#18181b",
    marginBottom: 10,
  },
  preview: { fontSize: 13, color: "#52525b", marginBottom: 10 },
  dateButton: {
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  dateLabel: { fontSize: 12, color: "#71717a" },
  dateValue: { fontSize: 15, fontWeight: "600", color: "#18181b", marginTop: 2 },
  error: { color: "#dc2626", fontSize: 13, marginBottom: 8 },
  submitButton: {
    backgroundColor: "#f59e0b",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  submitText: { color: "#fff", fontWeight: "700" },
  buttonDisabled: { opacity: 0.7 },
});