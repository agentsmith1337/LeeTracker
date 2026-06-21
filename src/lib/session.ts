import { auth } from "@/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { verifyMobileToken } from "@/lib/mobile-auth";
import { prisma } from "@/lib/prisma";

async function resolveUserIdFromBearer() {
  const headerStore = await headers();
  const authorization = headerStore.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice("Bearer ".length).trim();
  if (!token) return null;

  const claims = await verifyMobileToken(token);
  if (!claims) return null;

  const user = await prisma.user.findUnique({
    where: { id: claims.userId },
    select: { id: true },
  });

  return user?.id ?? null;
}

export async function requireUserId() {
  const bearerUserId = await resolveUserIdFromBearer();
  if (bearerUserId) {
    return { userId: bearerUserId, error: null };
  }

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