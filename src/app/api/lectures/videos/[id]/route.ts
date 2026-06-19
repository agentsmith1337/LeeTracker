import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId, error } = await requireUserId();
  if (error) return error;

  const { id } = await params;

  try {
    const video = await prisma.lectureVideo.findFirst({
      where: {
        id,
        playlist: { userId: userId! },
      },
    });

    if (!video) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const body = await request.json();
    const watched = Boolean(body.watched);

    const updated = await prisma.lectureVideo.update({
      where: { id },
      data: { watched },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Failed to update video." },
      { status: 500 },
    );
  }
}