import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export async function GET() {
  const { userId, error } = await requireUserId();
  if (error) return error;

  const playlists = await prisma.lecturePlaylist.findMany({
    where: { userId: userId! },
    include: {
      videos: {
        orderBy: { position: "asc" },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(playlists);
}