import { API_URL } from "@/lib/config";
import type {
  LecturePlaylist,
  LoginResponse,
  Revision,
} from "@/lib/types";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, headers, ...rest } = options;
  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      typeof data.error === "string" ? data.error : "Request failed",
      response.status,
    );
  }

  return data as T;
}

export function login(email: string, password: string) {
  return request<LoginResponse>("/api/auth/mobile/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function signup(email: string, password: string, name?: string) {
  return request<{ success: boolean }>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
}

export function createRevision(
  token: string,
  payload: {
    category: Revision["category"];
    title: string;
    url?: string;
    platform?: string;
    revisionDate: string;
  },
) {
  return request<Revision>("/api/revisions", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function fetchRevisions(token: string) {
  return request<Revision[]>("/api/revisions", { token });
}

export function rescheduleRevision(
  token: string,
  id: string,
  revisionDate: string,
) {
  return request<Revision>(`/api/revisions/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ revisionDate }),
  });
}

export function deleteRevision(token: string, id: string) {
  return request<{ success: boolean }>(`/api/revisions/${id}`, {
    method: "DELETE",
    token,
  });
}

export function fetchLectures(token: string) {
  return request<LecturePlaylist[]>("/api/lectures", { token });
}

export function importPlaylist(token: string, url: string) {
  return request<LecturePlaylist>("/api/lectures/import", {
    method: "POST",
    token,
    body: JSON.stringify({ url }),
  });
}

export function toggleVideoWatched(
  token: string,
  videoId: string,
  watched: boolean,
) {
  return request(`/api/lectures/videos/${videoId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ watched }),
  });
}

export function deletePlaylist(token: string, playlistId: string) {
  return request<{ success: boolean }>(`/api/lectures/${playlistId}`, {
    method: "DELETE",
    token,
  });
}

export function reorderPlaylists(token: string, orderedIds: string[]) {
  return request<{ success: boolean }>("/api/lectures/reorder", {
    method: "PATCH",
    token,
    body: JSON.stringify({ orderedIds }),
  });
}

export function thumbnailUrl(videoId: string | null) {
  if (!videoId) return null;
  return `${API_URL}/api/lectures/thumbnails/${videoId}`;
}