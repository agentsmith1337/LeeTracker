import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  deletePlaylist,
  fetchLectures,
  importPlaylist,
  reorderPlaylists,
  thumbnailUrl,
  toggleVideoWatched,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { LecturePlaylist } from "@/lib/types";

export default function LecturesScreen() {
  const { token } = useAuth();
  const [playlists, setPlaylists] = useState<LecturePlaylist[]>([]);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    if (!token) return;
    const data = await fetchLectures(token);
    setPlaylists(data);
  }, [token]);

  useEffect(() => {
    load()
      .catch(() => Alert.alert("Error", "Failed to load lectures"))
      .finally(() => setLoading(false));
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } catch {
      Alert.alert("Error", "Failed to refresh lectures");
    } finally {
      setRefreshing(false);
    }
  };

  const handleImport = async () => {
    if (!token || !url.trim()) return;
    setImporting(true);
    try {
      const imported = await importPlaylist(token, url.trim());
      setPlaylists((current) => [imported, ...current]);
      setUrl("");
    } catch (err) {
      Alert.alert(
        "Import failed",
        err instanceof Error ? err.message : "Could not import playlist",
      );
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = (playlist: LecturePlaylist) => {
    Alert.alert(
      "Delete playlist",
      `Delete "${playlist.title ?? "this playlist"}" and all videos?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!token) return;
            setDeletingId(playlist.id);
            try {
              await deletePlaylist(token, playlist.id);
              setPlaylists((current) =>
                current.filter((item) => item.id !== playlist.id),
              );
            } catch {
              Alert.alert("Error", "Failed to delete playlist");
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    );
  };

  const movePlaylist = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= playlists.length || !token) return;

    const next = [...playlists];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);
    const reindexed = next.map((playlist, sortIndex) => ({
      ...playlist,
      sortOrder: sortIndex,
    }));

    setPlaylists(reindexed);

    try {
      await reorderPlaylists(
        token,
        reindexed.map((playlist) => playlist.id),
      );
    } catch {
      Alert.alert("Error", "Failed to save playlist order");
      load();
    }
  };

  const handleToggleWatched = async (
    playlistId: string,
    videoId: string,
    watched: boolean,
  ) => {
    if (!token) return;
    try {
      await toggleVideoWatched(token, videoId, !watched);
      setPlaylists((current) =>
        current.map((playlist) =>
          playlist.id === playlistId
            ? {
                ...playlist,
                videos: playlist.videos.map((video) =>
                  video.id === videoId
                    ? { ...video, watched: !watched }
                    : video,
                ),
              }
            : playlist,
        ),
      );
    } catch {
      Alert.alert("Error", "Failed to update video");
    }
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
      <Text style={styles.heading}>Lectures</Text>
      <Text style={styles.subheading}>YouTube playlists and watch progress</Text>

      <View style={styles.importCard}>
        <TextInput
          style={styles.input}
          placeholder="Paste YouTube playlist URL"
          placeholderTextColor="#9ca3af"
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable
          style={[styles.importButton, importing && styles.buttonDisabled]}
          onPress={handleImport}
          disabled={importing}
        >
          {importing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.importButtonText}>Import playlist</Text>
          )}
        </Pressable>
      </View>

      {playlists.length === 0 ? (
        <Text style={styles.empty}>No playlists yet. Import one above.</Text>
      ) : (
        playlists.map((playlist, index) => {
          const isCollapsed = collapsed[playlist.id] ?? false;
          const watchedCount = playlist.videos.filter((v) => v.watched).length;

          return (
            <View key={playlist.id} style={styles.playlistCard}>
              <View style={styles.playlistHeader}>
                <View style={styles.reorderColumn}>
                  <Pressable
                    style={[
                      styles.reorderButton,
                      index === 0 && styles.reorderButtonDisabled,
                    ]}
                    onPress={() => movePlaylist(index, -1)}
                    disabled={index === 0}
                  >
                    <Text style={styles.reorderText}>↑</Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.reorderButton,
                      index === playlists.length - 1 &&
                        styles.reorderButtonDisabled,
                    ]}
                    onPress={() => movePlaylist(index, 1)}
                    disabled={index === playlists.length - 1}
                  >
                    <Text style={styles.reorderText}>↓</Text>
                  </Pressable>
                </View>

                <Pressable
                  style={styles.playlistInfo}
                  onPress={() =>
                    setCollapsed((current) => ({
                      ...current,
                      [playlist.id]: !isCollapsed,
                    }))
                  }
                >
                  <Text style={styles.playlistTitle}>
                    {isCollapsed ? "▸ " : "▾ "}
                    {playlist.title ?? "Untitled playlist"}
                  </Text>
                  <Text style={styles.playlistMeta}>
                    {watchedCount}/{playlist.videos.length} watched
                  </Text>
                </Pressable>
              </View>

              <View style={styles.playlistActions}>
                <Pressable onPress={() => Linking.openURL(playlist.url)}>
                  <Text style={styles.actionLink}>Open on YouTube</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleDelete(playlist)}
                  disabled={deletingId === playlist.id}
                >
                  <Text style={styles.deleteLink}>
                    {deletingId === playlist.id ? "Deleting..." : "Delete"}
                  </Text>
                </Pressable>
              </View>

              {!isCollapsed &&
                playlist.videos.map((video) => (
                  <View
                    key={video.id}
                    style={[
                      styles.videoRow,
                      video.watched && styles.videoRowWatched,
                    ]}
                  >
                    <Text style={styles.videoPosition}>{video.position}.</Text>
                    {thumbnailUrl(video.videoId) ? (
                      <Image
                        source={{ uri: thumbnailUrl(video.videoId)! }}
                        style={styles.thumbnail}
                      />
                    ) : (
                      <View
                        style={[styles.thumbnail, styles.thumbnailFallback]}
                      />
                    )}
                    <View style={styles.videoContent}>
                      <Text
                        style={[
                          styles.videoTitle,
                          video.watched && styles.videoTitleWatched,
                        ]}
                        numberOfLines={2}
                      >
                        {video.title}
                      </Text>
                      <View style={styles.videoActions}>
                        <Pressable
                          onPress={() =>
                            handleToggleWatched(
                              playlist.id,
                              video.id,
                              video.watched,
                            )
                          }
                        >
                          <Text style={styles.watchToggle}>
                            {video.watched ? "Watched" : "Mark watched"}
                          </Text>
                        </Pressable>
                        {video.url ? (
                          <Pressable
                            onPress={() => Linking.openURL(video.url!)}
                          >
                            <Text style={styles.openLink}>Open</Text>
                          </Pressable>
                        ) : null}
                      </View>
                    </View>
                  </View>
                ))}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafafa" },
  content: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  heading: { fontSize: 24, fontWeight: "700", color: "#18181b" },
  subheading: { marginTop: 4, marginBottom: 16, color: "#71717a", fontSize: 14 },
  importCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    marginBottom: 16,
  },
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
  importButton: {
    backgroundColor: "#18181b",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  importButtonText: { color: "#fff", fontWeight: "600" },
  buttonDisabled: { opacity: 0.7 },
  empty: { color: "#a1a1aa", fontSize: 14 },
  playlistCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    marginBottom: 12,
  },
  playlistHeader: { flexDirection: "row", gap: 10 },
  reorderColumn: { gap: 4 },
  reorderButton: {
    width: 32,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fafafa",
  },
  reorderButtonDisabled: { opacity: 0.35 },
  reorderText: { fontSize: 14, fontWeight: "700", color: "#52525b" },
  playlistInfo: { flex: 1 },
  playlistTitle: { fontSize: 16, fontWeight: "700", color: "#18181b" },
  playlistMeta: { marginTop: 4, color: "#71717a", fontSize: 13 },
  playlistActions: {
    flexDirection: "row",
    gap: 16,
    marginTop: 10,
    marginBottom: 4,
  },
  actionLink: { color: "#d97706", fontSize: 13, fontWeight: "600" },
  deleteLink: { color: "#dc2626", fontSize: 13, fontWeight: "600" },
  videoRow: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 10,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f4f4f5",
    alignItems: "flex-start",
  },
  videoRowWatched: {
    backgroundColor: "#ecfdf5",
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  videoPosition: {
    width: 22,
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    color: "#71717a",
  },
  thumbnail: {
    width: 88,
    height: 50,
    borderRadius: 8,
    backgroundColor: "#e4e4e7",
  },
  thumbnailFallback: { backgroundColor: "#d4d4d8" },
  videoContent: { flex: 1 },
  videoTitle: { fontSize: 14, fontWeight: "500", color: "#27272a" },
  videoTitleWatched: {
    color: "#71717a",
    textDecorationLine: "line-through",
  },
  videoActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  watchToggle: { color: "#2563eb", fontSize: 13, fontWeight: "600" },
  openLink: { color: "#52525b", fontSize: 13, fontWeight: "600" },
});