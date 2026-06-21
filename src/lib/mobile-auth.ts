import { SignJWT, jwtVerify } from "jose";

const TOKEN_EXPIRY = "30d";

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function createMobileToken(payload: {
  userId: string;
  email: string;
  name: string | null;
}) {
  return new SignJWT({
    email: payload.email,
    name: payload.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(getSecretKey());
}

export async function verifyMobileToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const userId = payload.sub;
    if (!userId) return null;
    return {
      userId,
      email: typeof payload.email === "string" ? payload.email : undefined,
      name: typeof payload.name === "string" ? payload.name : null,
    };
  } catch {
    return null;
  }
}