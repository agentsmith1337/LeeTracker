import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function requireUserId() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return {
      userId: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    return {
      userId: null,
      error: NextResponse.json(
        {
          error:
            "Your session is outdated. Sign out and log in again to continue.",
        },
        { status: 401 },
      ),
    };
  }

  return { userId, error: null };
}