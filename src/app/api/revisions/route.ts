import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export async function GET() {
  const { userId, error } = await requireUserId();
  if (error) return error;

  const revisions = await prisma.revision.findMany({
    where: { userId: userId! },
    orderBy: { revisionDate: "asc" },
  });

  return NextResponse.json(revisions);
}

export async function POST(request: Request) {
  const { userId, error } = await requireUserId();
  if (error) return error;

  try {
    const body = await request.json();
    const category = body.category as "CODING" | "RIDDLE" | "QUANT";
    const title = String(body.title ?? "").trim();
    const url = body.url ? String(body.url).trim() : null;
    const platform = body.platform ? String(body.platform) : null;
    const revisionDate = String(body.revisionDate ?? "");

    if (!title || !revisionDate || !category) {
      return NextResponse.json(
        { error: "Title, category, and revision date are required." },
        { status: 400 },
      );
    }

    if (category === "CODING" && !url) {
      return NextResponse.json(
        { error: "Coding revisions require a problem URL." },
        { status: 400 },
      );
    }

    const revision = await prisma.revision.create({
      data: {
        userId: userId!,
        category,
        title,
        url,
        platform,
        revisionDate,
      },
    });

    return NextResponse.json(revision, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create revision." },
      { status: 500 },
    );
  }
}