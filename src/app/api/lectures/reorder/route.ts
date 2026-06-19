import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export async function PATCH(request: Request) {
  const { userId, error } = await requireUserId();
  if (error) return error;

  try {
    const body = await request.json();
    const orderedIds = body.orderedIds as string[];

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json(
        { error: "orderedIds array is required." },
        { status: 400 },
      );
    }

    const playlists = await prisma.lecturePlaylist.findMany({
      where: { userId: userId! },
      select: { id: true },
    });

    const ownedIds = new Set(playlists.map((playlist) => playlist.id));
    if (
      orderedIds.length !== playlists.length ||
      orderedIds.some((id) => !ownedIds.has(id))
    ) {
      return NextResponse.json(
        { error: "Invalid playlist order." },
        { status: 400 },
      );
    }

    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.lecturePlaylist.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to reorder playlists." },
      { status: 500 },
    );
  }
}