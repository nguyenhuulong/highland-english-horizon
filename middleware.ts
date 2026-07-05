import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const ROLE_HOME: Record<string, string> = {
  STUDENT: "/dashboard/student",
  TEACHER: "/dashboard/teacher",
  ADMIN: "/dashboard/admin",
};

const ROLE_ALLOWED: Record<string, string[]> = {
  STUDENT: ["/dashboard/student"],
  TEACHER: ["/dashboard/teacher", "/creator"],
  ADMIN: ["/dashboard/admin"],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/creator");
  if (!isProtected) return NextResponse.next();

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    cookieName:
      process.env.NODE_ENV === "production"
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
  });

  if (!token) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  const role = (token.role as string) || "STUDENT";
  const home = ROLE_HOME[role] || "/dashboard/student";
  const allowed = ROLE_ALLOWED[role] || [home];

  if (pathname === "/dashboard") {
    return NextResponse.redirect(new URL(home, req.url));
  }

  if (allowed.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL(home, req.url));
}

export const config = {
  matcher: ["/dashboard/:path*", "/creator/:path*"],
};
