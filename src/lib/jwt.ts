// Runtime-agnostic JWT helpers (safe to import from proxy.ts and server code).
import { SignJWT, jwtVerify } from "jose";

export const COOKIE_NAME = "vzt_session";
export const SESSION_DAYS = 14;

export type SessionPayload = {
  userId: string;
  expiresAt: string;
};

function getKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET is missing or too short. Set it in .env");
  }
  return new TextEncoder().encode(secret);
}

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getKey());
}

export async function decrypt(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getKey(), { algorithms: ["HS256"] });
    return payload as SessionPayload;
  } catch {
    return null;
  }
}
