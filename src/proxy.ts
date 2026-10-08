import { NextResponse, type NextRequest } from "next/server";
import { decrypt, COOKIE_NAME } from "@/lib/jwt";

// Optimistic auth checks only. Real authorization happens in layouts/actions via src/lib/auth.ts.
const PROTECTED = ["/dashboard", "/admin"];
const AUTH_PAGES = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await decrypt(request.cookies.get(COOKIE_NAME)?.value);

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));

  if (isProtected && !session) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (isAuthPage && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login", "/register"],
};
