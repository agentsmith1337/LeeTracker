import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const THUMBNAIL_DIR = path.join(process.cwd(), "storage", "lecture-thumbnails");

export function getThumbnailFilePath(videoId: string): string {
  return path.join(THUMBNAIL_DIR, `${videoId}.jpg`);
}

export function getThumbnailPublicPath(videoId: string): string {
  return `/api/lectures/thumbnails/${videoId}`;
}

export async function saveVideoThumbnail(
  videoId: string,
): Promise<string | null> {
  const sourceUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  try {
    const response = await fetch(sourceUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) return null;

    const buffer = Buffer.from(await response.arrayBuffer());
    await mkdir(THUMBNAIL_DIR, { recursive: true });
    await writeFile(getThumbnailFilePath(videoId), buffer);

    return getThumbnailPublicPath(videoId);
  } catch {
    return null;
  }
}