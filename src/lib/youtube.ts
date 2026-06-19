interface RawVideo {
  videoId: string;
  title: string;
}

const INNERTUBE_KEY = "AIzaSyAO_FJ2SlbwU9FTMkSYz-0b8e0lxJ8Q";

const INNERTUBE_CONTEXT = {
  client: {
    clientName: "WEB",
    clientVersion: "2.20250301.00.00",
    hl: "en",
    gl: "US",
  },
};

type TextObject =
  | { simpleText?: string }
  | { runs?: Array<{ text?: string }> }
  | { content?: string }
  | undefined;

function extractText(value: TextObject): string | null {
  if (!value) return null;
  if ("simpleText" in value && value.simpleText) {
    return value.simpleText;
  }
  if ("content" in value && value.content) {
    return value.content;
  }
  if ("runs" in value && value.runs?.length) {
    return value.runs.map((run) => run.text ?? "").join("");
  }
  return null;
}

function decodeXml(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export function extractPlaylistId(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get("list");
  } catch {
    return null;
  }
}

function walkJson(node: unknown, visit: (value: unknown) => void) {
  if (!node || typeof node !== "object") return;
  visit(node);
  if (Array.isArray(node)) {
    for (const item of node) walkJson(item, visit);
    return;
  }
  for (const value of Object.values(node)) {
    walkJson(value, visit);
  }
}

function extractVideoIdFromLockup(lockup: Record<string, unknown>): string | null {
  const contentImage = lockup.contentImage as Record<string, unknown> | undefined;
  const thumbnailViewModel = contentImage?.thumbnailViewModel as
    | Record<string, unknown>
    | undefined;
  const overlays = thumbnailViewModel?.overlays as unknown[] | undefined;

  for (const overlay of overlays ?? []) {
    if (!overlay || typeof overlay !== "object") continue;
    const record = overlay as Record<string, unknown>;
    const bottom = record.thumbnailBottomOverlayViewModel as
      | Record<string, unknown>
      | undefined;
    const badges = bottom?.badges as unknown[] | undefined;
    for (const badge of badges ?? []) {
      if (!badge || typeof badge !== "object") continue;
      const badgeView = (badge as Record<string, unknown>)
        .thumbnailBadgeViewModel as Record<string, unknown> | undefined;
      const targetId = badgeView?.animationActivationTargetId as
        | string
        | undefined;
      if (targetId && targetId.length === 11) return targetId;
    }
  }

  let videoId: string | null = null;
  walkJson(lockup, (node) => {
    if (videoId || !node || typeof node !== "object") return;
    const record = node as Record<string, unknown>;
    const candidate = record.videoId;
    if (typeof candidate === "string" && candidate.length === 11) {
      videoId = candidate;
    }
  });

  return videoId;
}

function extractVideosFromData(data: unknown): RawVideo[] {
  const videos: RawVideo[] = [];
  const seen = new Set<string>();

  walkJson(data, (node) => {
    if (!node || typeof node !== "object") return;
    const record = node as Record<string, unknown>;

    const legacyRenderer = record.playlistVideoRenderer as
      | Record<string, unknown>
      | undefined;
    if (legacyRenderer) {
      const videoId = legacyRenderer.videoId as string | undefined;
      const title = extractText(legacyRenderer.title as TextObject);
      if (videoId && title && !seen.has(videoId)) {
        seen.add(videoId);
        videos.push({ videoId, title });
      }
      return;
    }

    const lockup = record.lockupViewModel as Record<string, unknown> | undefined;
    if (!lockup) return;

    const videoId = extractVideoIdFromLockup(lockup);
    const metadata = lockup.metadata as Record<string, unknown> | undefined;
    const lockupMetadata = metadata?.lockupMetadataViewModel as
      | Record<string, unknown>
      | undefined;
    const title = extractText(lockupMetadata?.title as TextObject);

    if (videoId && title && !seen.has(videoId)) {
      seen.add(videoId);
      videos.push({ videoId, title });
    }
  });

  return videos;
}

function extractPlaylistTitle(data: unknown): string | null {
  let title: string | null = null;

  walkJson(data, (node) => {
    if (title || !node || typeof node !== "object") return;
    const record = node as Record<string, unknown>;
    const header = record.playlistHeaderRenderer as
      | Record<string, unknown>
      | undefined;
    if (!header) return;

    const parsedTitle = extractText(header.title as TextObject);
    if (parsedTitle) {
      title = parsedTitle;
    }
  });

  return title;
}

function extractContinuation(data: unknown): string | null {
  let token: string | null = null;

  walkJson(data, (node) => {
    if (token || !node || typeof node !== "object") return;
    const record = node as Record<string, unknown>;

    const legacyContinuation = record.continuationItemRenderer as
      | Record<string, unknown>
      | undefined;
    const legacyToken = (
      legacyContinuation?.continuationEndpoint as
        | { continuationCommand?: { token?: string } }
        | undefined
    )?.continuationCommand?.token;
    if (legacyToken) {
      token = legacyToken;
      return;
    }

    const modernContinuation = record.continuationItemViewModel as
      | Record<string, unknown>
      | undefined;
    const modernToken = (
      modernContinuation?.continuationEndpoint as
        | { continuationCommand?: { token?: string } }
        | undefined
    )?.continuationCommand?.token;
    if (modernToken) {
      token = modernToken;
    }
  });

  return token;
}

function parseYtInitialData(html: string): unknown {
  const marker = "var ytInitialData = ";
  const startIndex = html.indexOf(marker);
  if (startIndex === -1) {
    throw new Error("Could not parse YouTube playlist data.");
  }

  const jsonStart = html.indexOf("{", startIndex + marker.length);
  if (jsonStart === -1) {
    throw new Error("Could not parse YouTube playlist data.");
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = jsonStart; index < html.length; index++) {
    const char = html[index];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") depth++;
    if (char === "}") {
      depth--;
      if (depth === 0) {
        return JSON.parse(html.slice(jsonStart, index + 1)) as unknown;
      }
    }
  }

  throw new Error("Could not parse YouTube playlist data.");
}

async function fetchInnertube(body: Record<string, unknown>) {
  const response = await fetch(
    `https://www.youtube.com/youtubei/v1/browse?key=${INNERTUBE_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch playlist from YouTube.");
  }

  return response.json();
}

async function fetchInitialPlaylistData(playlistId: string) {
  const response = await fetch(
    `https://www.youtube.com/playlist?list=${playlistId}`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        Cookie: "CONSENT=YES+1",
      },
    },
  );

  if (!response.ok) {
    throw new Error("Could not load YouTube playlist page.");
  }

  const html = await response.text();
  return parseYtInitialData(html);
}

async function fetchAllPlaylistVideos(playlistId: string): Promise<{
  title: string;
  videos: RawVideo[];
}> {
  const allVideos: RawVideo[] = [];
  let playlistTitle = "Untitled Playlist";

  let data = await fetchInitialPlaylistData(playlistId);
  const initialTitle = extractPlaylistTitle(data);
  if (initialTitle) playlistTitle = initialTitle;

  allVideos.push(...extractVideosFromData(data));

  let continuation = extractContinuation(data);
  let pages = 0;

  while (continuation && pages < 50) {
    data = await fetchInnertube({
      context: INNERTUBE_CONTEXT,
      continuation,
    });

    const pageVideos = extractVideosFromData(data);
    if (pageVideos.length === 0) break;

    allVideos.push(...pageVideos);
    continuation = extractContinuation(data);
    pages++;
  }

  const unique = new Map<string, RawVideo>();
  for (const video of allVideos) {
    unique.set(video.videoId, video);
  }

  return { title: playlistTitle, videos: Array.from(unique.values()) };
}

export async function fetchPlaylistVideos(playlistId: string): Promise<{
  title: string;
  videos: Array<{ videoId: string; title: string; position: number }>;
}> {
  const { title, videos } = await fetchAllPlaylistVideos(playlistId);

  if (videos.length === 0) {
    throw new Error("No videos found in this playlist.");
  }

  return {
    title,
    videos: videos.map((video, index) => ({
      ...video,
      position: index + 1,
    })),
  };
}