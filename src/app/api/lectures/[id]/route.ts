import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId, error } = await requireUserId();
  if (error) return error;

  const { id } = await params;

  try {
    const existing = await prisma.lecturePlaylist.findFirst({
      where: { id, userId: userId! },
    });

    if (!existing) {
      return NextResponse.json({ error: "Playlist not found." }, { status: 404 });
    }

    await prisma.lecturePlaylist.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete playlist." },
      { status: 500 },
    );
  }
}