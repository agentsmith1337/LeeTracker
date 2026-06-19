"use client";

import Image from "next/image";
import {
  DragEvent,
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { LecturePlaylist } from "@/types/revision";

export function LecturesPage() {
  const [playlists, setPlaylists] = useState<LecturePlaylist[]>([]);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const playlistsRef = useRef(playlists);

  useEffect(() => {
    playlistsRef.current = playlists;
  }, [playlists]);

  const fetchPlaylists = useCallback(async () => {
    const response = await fetch("/api/lectures");
    if (response.ok) {
      setPlaylists((await response.json()) as LecturePlaylist[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  const persistOrder = async (ordered: LecturePlaylist[]) => {
    const response = await fetch("/api/lectures/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: ordered.map((p) => p.id) }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error ?? "Failed to reorder playlists.");
    }
  };

  const handleImport = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setImporting(true);

    try {
      const response = await fetch("/api/lectures/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to import playlist.");
      }

      const imported = data as LecturePlaylist;
      setPlaylists((current) => {
        const shifted = current.map((playlist) => ({
          ...playlist,
          sortOrder: playlist.sortOrder + 1,
        }));
        return [imported, ...shifted];
      });
      setUrl("");
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : "Failed to import playlist.",
      );
    } finally {
      setImporting(false);
    }
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    if (!confirm("Delete this playlist and all its videos?")) return;

    setDeletingId(playlistId);
    setError("");

    try {
      const response = await fetch(`/api/lectures/${playlistId}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to delete playlist.");
      }

      setPlaylists((current) =>
        current.filter((playlist) => playlist.id !== playlistId),
      );
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete playlist.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const toggleCollapsed = (playlistId: string) => {
    setCollapsedIds((current) => {
      const next = new Set(current);
      if (next.has(playlistId)) {
        next.delete(playlistId);
      } else {
        next.add(playlistId);
      }
      return next;
    });
  };

  const handleDragStart = (playlistId: string) => {
    setDraggedId(playlistId);
  };

  const handleDragOver = (event: DragEvent, targetId: string) => {
    event.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    setPlaylists((current) => {
      const draggedIndex = current.findIndex((p) => p.id === draggedId);
      const targetIndex = current.findIndex((p) => p.id === targetId);
      if (draggedIndex === -1 || targetIndex === -1) return current;

      const next = [...current];
      const [moved] = next.splice(draggedIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next.map((playlist, index) => ({ ...playlist, sortOrder: index }));
    });
  };

  const handleDragEnd = async () => {
    const ordered = playlistsRef.current;
    setDraggedId(null);

    try {
      await persistOrder(ordered);
    } catch (reorderError) {
      setError(
        reorderError instanceof Error
          ? reorderError.message
          : "Failed to save playlist order.",
      );
      fetchPlaylists();
    }
  };

  const toggleWatched = async (videoId: string, watched: boolean) => {
    const response = await fetch(`/api/lectures/videos/${videoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ watched }),
    });

    if (response.ok) {
      const updated = await response.json();
      setPlaylists((current) =>
        current.map((playlist) => ({
          ...playlist,
          videos: playlist.videos.map((video) =>
            video.id === videoId ? { ...video, watched: updated.watched } : video,
          ),
        })),
      );
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Loading lectures...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Lecture Tracking
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          Import a YouTube playlist and track videos in order
        </p>
      </header>

      <form
        onSubmit={handleImport}
        className="mb-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
      >
        <label
          htmlFor="playlist-url"
          className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-200"
        >
          YouTube Playlist URL
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="playlist-url"
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://www.youtube.com/playlist?list=..."
            className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <button
            type="submit"
            disabled={importing}
            className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-amber-300"
          >
            {importing ? "Importing..." : "Import Playlist"}
          </button>
        </div>
        {error && (
          <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">{error}</p>
        )}
      </form>

      {playlists.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-100 px-6 py-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
            No playlists yet
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Paste a YouTube playlist link above to import all lecture titles.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Drag the handle to reorder playlists. Click the header to expand or
            collapse.
          </p>
          {playlists.map((playlist) => {
            const isCollapsed = collapsedIds.has(playlist.id);
            const isDragging = draggedId === playlist.id;
            const watchedCount = playlist.videos.filter((v) => v.watched).length;
            const firstThumbnail =
              playlist.videos.find((video) => video.thumbnailPath)
                ?.thumbnailPath ?? null;

            return (
              <section
                key={playlist.id}
                onDragOver={(event) => handleDragOver(event, playlist.id)}
                onDrop={(event) => event.preventDefault()}
                className={`rounded-2xl border bg-white shadow-sm transition-opacity dark:bg-zinc-900 ${
                  isDragging
                    ? "border-amber-400 opacity-70 dark:border-amber-600"
                    : "border-zinc-200 dark:border-zinc-700"
                }`}
              >
                <div className="flex items-start gap-3 p-4">
                  <div
                    draggable
                    onDragStart={() => handleDragStart(playlist.id)}
                    onDragEnd={handleDragEnd}
                    aria-label="Drag to reorder playlist"
                    className="mt-1 cursor-grab rounded-lg border border-zinc-300 px-2 py-3 text-xs text-zinc-500 active:cursor-grabbing dark:border-zinc-600 dark:text-zinc-400"
                  >
                    ⋮⋮
                  </div>

                  {firstThumbnail && (
                    <div className="hidden shrink-0 sm:block">
                      <div className="relative h-16 w-28 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
                        <Image
                          src={firstThumbnail}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="112px"
                          unoptimized
                        />
                      </div>
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => toggleCollapsed(playlist.id)}
                      className="flex w-full items-start justify-between gap-3 text-left"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-zinc-500 dark:text-zinc-400">
                            {isCollapsed ? "▸" : "▾"}
                          </span>
                          <h2 className="truncate text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                            {playlist.title || "Untitled Playlist"}
                          </h2>
                        </div>
                        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                          {watchedCount}/{playlist.videos.length} watched ·{" "}
                          {playlist.videos.length} videos
                        </p>
                      </div>
                    </button>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <a
                        href={playlist.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-amber-700 hover:underline dark:text-amber-400"
                      >
                        Open on YouTube
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDeletePlaylist(playlist.id)}
                        disabled={deletingId === playlist.id}
                        className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950"
                      >
                        {deletingId === playlist.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>

                {!isCollapsed && (
                  <ol className="space-y-2 border-t border-zinc-200 px-4 py-4 dark:border-zinc-700">
                    {playlist.videos.map((video) => (
                      <li
                        key={video.id}
                        className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                          video.watched
                            ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950"
                            : "border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800"
                        }`}
                      >
                        <span className="w-7 shrink-0 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                          {video.position}.
                        </span>

                        {video.thumbnailPath ? (
                          <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-600">
                            <Image
                              src={video.thumbnailPath}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="80px"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="h-12 w-20 shrink-0 rounded-lg bg-zinc-200 dark:bg-zinc-700" />
                        )}

                        <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                          <input
                            type="checkbox"
                            checked={video.watched}
                            onChange={(event) =>
                              toggleWatched(video.id, event.target.checked)
                            }
                            className="h-4 w-4 rounded border-zinc-300 text-amber-500 focus:ring-amber-400"
                          />
                          {video.url ? (
                            <a
                              href={video.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`truncate text-sm font-medium hover:underline ${
                                video.watched
                                  ? "text-zinc-500 line-through dark:text-zinc-500"
                                  : "text-zinc-900 dark:text-zinc-100"
                              }`}
                            >
                              {video.title}
                            </a>
                          ) : (
                            <span
                              className={`truncate text-sm font-medium ${
                                video.watched
                                  ? "text-zinc-500 line-through dark:text-zinc-500"
                                  : "text-zinc-900 dark:text-zinc-100"
                              }`}
                            >
                              {video.title}
                            </span>
                          )}
                        </label>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}