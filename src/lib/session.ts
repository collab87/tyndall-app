// Edge-safe session helpers (used by middleware and the server).
import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "tyn_session";
const MAX_AGE = 60 * 60 * 12; // 12 hours

export type Session = { uid: string; role: string; name: string; orgId: string | null };

function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET must be set to at least 32 characters");
  return new TextEncoder().encode(secret);
}

export async function signSession(s: Session) {
  return new SignJWT(s)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(key());
}

export async function readSession(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    return { uid: String(payload.uid), role: String(payload.role), name: String(payload.name), orgId: (payload.orgId as string) ?? null };
  } catch {
    return null;
  }
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE,
};
