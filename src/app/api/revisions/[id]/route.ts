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
    const existing = await prisma.revision.findFirst({
      where: { id, userId: userId! },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const body = await request.json();
    const revisionDate = String(body.revisionDate ?? "");

    if (!revisionDate) {
      return NextResponse.json(
        { error: "Revision date is required." },
        { status: 400 },
      );
    }

    const revision = await prisma.revision.update({
      where: { id },
      data: { revisionDate },
    });

    return NextResponse.json(revision);
  } catch {
    return NextResponse.json(
      { error: "Failed to update revision." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId, error } = await requireUserId();
  if (error) return error;

  const { id } = await params;

  try {
    const existing = await prisma.revision.findFirst({
      where: { id, userId: userId! },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    await prisma.revision.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete revision." },
      { status: 500 },
    );
  }
}