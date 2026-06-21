import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AddRevisionForm } from "@/components/AddRevisionForm";
import {
  deleteRevision,
  fetchRevisions,
  rescheduleRevision,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { CATEGORY_META, PLATFORM_LABELS } from "@/lib/categories";
import { addMonths, addWeeks, formatDisplayDate, isDueToday } from "@/lib/dates";
import type { Revision, RevisionCategory } from "@/lib/types";

const CATEGORIES: RevisionCategory[] = ["CODING", "RIDDLE", "QUANT"];

export default function RevisionsScreen() {
  const { token, signOut } = useAuth();
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    const data = await fetchRevisions(token);
    setRevisions(data);
  }, [token]);

  useEffect(() => {
    load()
      .catch(() => Alert.alert("Error", "Failed to load revisions"))
      .finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } catch {
      Alert.alert("Error", "Failed to refresh revisions");
    } finally {
      setRefreshing(false);
    }
  };

  const dueToday = useMemo(
    () => revisions.filter((revision) => isDueToday(revision.revisionDate)),
    [revisions],
  );

  const upcomingByCategory = useMemo(() => {
    const upcoming = revisions.filter(
      (revision) => !isDueToday(revision.revisionDate),
    );
    return CATEGORIES.map((category) => ({
      category,
      items: upcoming
        .filter((revision) => revision.category === category)
        .sort((a, b) => a.revisionDate.localeCompare(b.revisionDate)),
    }));
  }, [revisions]);

  const handleReschedule = async (revision: Revision, revisionDate: string) => {
    if (!token) return;
    try {
      const updated = await rescheduleRevision(token, revision.id, revisionDate);
      setRevisions((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch {
      Alert.alert("Error", "Failed to reschedule");
    }
  };

  const handleAdded = (revision: Revision) => {
    setRevisions((current) =>
      [...current, revision].sort((a, b) =>
        a.revisionDate.localeCompare(b.revisionDate),
      ),
    );
  };

  const handleDelete = (revision: Revision) => {
    Alert.alert("Delete revision", `Remove "${revision.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (!token) return;
          try {
            await deleteRevision(token, revision.id);
            setRevisions((current) =>
              current.filter((item) => item.id !== revision.id),
            );
          } catch {
            Alert.alert("Error", "Failed to delete revision");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#18181b" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.heading}>Revisions</Text>
          <Text style={styles.subheading}>Due today and upcoming</Text>
        </View>
        <Pressable onPress={signOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </View>

      {token ? (
        <AddRevisionForm token={token} onAdded={handleAdded} />
      ) : null}

      <Text style={styles.sectionTitle}>Due today</Text>
      {dueToday.length === 0 ? (
        <Text style={styles.empty}>Nothing due today.</Text>
      ) : (
        dueToday.map((revision) => (
          <RevisionCard
            key={revision.id}
            revision={revision}
            onDelete={() => handleDelete(revision)}
            onReschedule={(date) => handleReschedule(revision, date)}
          />
        ))
      )}

      <Text style={[styles.sectionTitle, styles.sectionGap]}>Upcoming</Text>
      {upcomingByCategory.every((group) => group.items.length === 0) ? (
        <Text style={styles.empty}>No upcoming revisions.</Text>
      ) : (
        upcomingByCategory.map(({ category, items }) => {
          if (items.length === 0) return null;
          const meta = CATEGORY_META[category];
          return (
            <View key={category} style={styles.group}>
              <View
                style={[styles.badge, { backgroundColor: meta.background }]}
              >
                <Text style={[styles.badgeText, { color: meta.color }]}>
                  {meta.label}
                </Text>
              </View>
              {items.map((revision) => (
                <RevisionCard
                  key={revision.id}
                  revision={revision}
                  onDelete={() => handleDelete(revision)}
                  onReschedule={(date) => handleReschedule(revision, date)}
                />
              ))}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

function RevisionCard({
  revision,
  onDelete,
  onReschedule,
}: {
  revision: Revision;
  onDelete: () => void;
  onReschedule: (date: string) => void;
}) {
  const meta = CATEGORY_META[revision.category];

  return (
    <View style={[styles.card, { backgroundColor: meta.background }]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{revision.title}</Text>
        <Pressable onPress={onDelete}>
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      </View>
      <Text style={styles.cardDate}>
        {formatDisplayDate(revision.revisionDate)}
      </Text>
      {revision.platform ? (
        <Text style={styles.platform}>
          {PLATFORM_LABELS[revision.platform] ?? revision.platform}
        </Text>
      ) : null}
      {revision.url ? (
        <Pressable onPress={() => Linking.openURL(revision.url!)}>
          <Text style={styles.openLink}>Open problem</Text>
        </Pressable>
      ) : null}
      <View style={styles.actions}>
        <Pressable
          style={styles.actionButton}
          onPress={() => onReschedule(addWeeks(1))}
        >
          <Text style={styles.actionText}>+1 week</Text>
        </Pressable>
        <Pressable
          style={styles.actionButton}
          onPress={() => onReschedule(addMonths(1))}
        >
          <Text style={styles.actionText}>+1 month</Text>
        </Pressable>
        <Pressable
          style={styles.actionButton}
          onPress={() => onReschedule(addMonths(3))}
        >
          <Text style={styles.actionText}>+3 months</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafafa" },
  content: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  heading: { fontSize: 24, fontWeight: "700", color: "#18181b" },
  subheading: { marginTop: 4, color: "#71717a", fontSize: 14 },
  signOutButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    backgroundColor: "#fff",
  },
  signOutText: { color: "#52525b", fontSize: 13, fontWeight: "600" },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: "#18181b" },
  sectionGap: { marginTop: 24 },
  empty: { marginTop: 8, color: "#a1a1aa", fontSize: 14 },
  group: { marginTop: 12 },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
  },
  badgeText: { fontSize: 12, fontWeight: "700" },
  card: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e4e4e7",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#18181b",
  },
  deleteText: { color: "#dc2626", fontSize: 13, fontWeight: "600" },
  cardDate: { marginTop: 6, color: "#52525b", fontSize: 13 },
  platform: { marginTop: 4, fontSize: 12, fontWeight: "600", color: "#71717a" },
  openLink: { marginTop: 8, color: "#2563eb", fontSize: 13, fontWeight: "600" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  actionButton: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#d4d4d8",
  },
  actionText: { fontSize: 12, fontWeight: "600", color: "#3f3f46" },
});