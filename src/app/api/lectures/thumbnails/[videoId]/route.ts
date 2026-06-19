import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { getThumbnailFilePath } from "@/lib/thumbnails";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ videoId: string }> },
) {
  const { videoId } = await params;

  if (!/^[a-zA-Z0-9_-]+$/.test(videoId)) {
    return NextResponse.json({ error: "Invalid video id." }, { status: 400 });
  }

  try {
    const file = await readFile(getThumbnailFilePath(videoId));
    return new NextResponse(file, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Thumbnail not found." }, { status: 404 });
  }
}