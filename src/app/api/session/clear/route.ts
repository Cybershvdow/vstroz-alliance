import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/jwt";

/* Clears a stale session cookie (valid token, but the user no longer exists — e.g. after a reseed)
   and sends the visitor to the sign-in page. Server Components cannot modify cookies, so they redirect here. */
export function GET(request: Request) {
  const res = NextResponse.redirect(new URL("/login", request.url));
  res.cookies.set(COOKIE_NAME, "", { path: "/", expires: new Date(0) });
  return res;
}
