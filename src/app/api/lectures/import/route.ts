import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { saveVideoThumbnail } from "@/lib/thumbnails";
import { extractPlaylistId, fetchPlaylistVideos } from "@/lib/youtube";

export async function POST(request: Request) {
  const { userId, error } = await requireUserId();
  if (error) return error;

  try {
    const body = await request.json();
    const url = String(body.url ?? "").trim();

    if (!url) {
      return NextResponse.json(
        { error: "Playlist URL is required." },
        { status: 400 },
      );
    }

    const playlistId = extractPlaylistId(url);
    if (!playlistId) {
      return NextResponse.json(
        { error: "Invalid YouTube playlist URL." },
        { status: 400 },
      );
    }

    const { title, videos } = await fetchPlaylistVideos(playlistId);

    if (videos.length === 0) {
      return NextResponse.json(
        { error: "No videos found in this playlist." },
        { status: 400 },
      );
    }

    const videosWithThumbnails = await Promise.all(
      videos.map(async (video) => {
        let thumbnailPath: string | null = null;
        try {
          thumbnailPath = await saveVideoThumbnail(video.videoId);
        } catch {
          thumbnailPath = null;
        }
        return { ...video, thumbnailPath };
      }),
    );

    const playlist = await prisma.$transaction(async (tx) => {
      await tx.lecturePlaylist.updateMany({
        where: { userId: userId! },
        data: { sortOrder: { increment: 1 } },
      });

      const created = await tx.lecturePlaylist.create({
        data: {
          userId: userId!,
          url,
          title,
          sortOrder: 0,
        },
      });

      await tx.lectureVideo.createMany({
        data: videosWithThumbnails.map((video) => ({
          playlistId: created.id,
          position: video.position,
          title: video.title,
          videoId: video.videoId,
          url: `https://www.youtube.com/watch?v=${video.videoId}&list=${playlistId}`,
          thumbnailPath: video.thumbnailPath,
        })),
      });

      return tx.lecturePlaylist.findUniqueOrThrow({
        where: { id: created.id },
        include: {
          videos: {
            orderBy: { position: "asc" },
          },
        },
      });
    });

    return NextResponse.json(playlist, { status: 201 });
  } catch (importError) {
    console.error("Playlist import failed:", importError);

    let message = "Failed to import playlist.";
    if (importError instanceof Error) {
      message = importError.message;
      if ("code" in importError) {
        message += ` (code: ${String(importError.code)})`;
      }
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}