import "server-only";
import { cookies } from "next/headers";
import { encrypt, decrypt, COOKIE_NAME, SESSION_DAYS, type SessionPayload } from "@/lib/jwt";

export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const token = await encrypt({ userId, expiresAt: expiresAt.toISOString() });
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return decrypt(store.get(COOKIE_NAME)?.value);
}

export async function deleteSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
