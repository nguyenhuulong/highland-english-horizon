import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const ROLE_HOME: Record<string, string> = {
  STUDENT: "/dashboard/student",
  TEACHER: "/dashboard/teacher",
  ADMIN: "/dashboard/admin",
};

const TEACHER_ALLOWED_PREFIXES = [
  "/dashboard/teacher",
  "/dashboard/admin/characters",
  "/dashboard/admin/backgrounds",
  "/dashboard/admin/stories",
  "/dashboard/admin/students",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/creator");
  if (!isProtected) return NextResponse.next();

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  const role = (token.role as string) || "STUDENT";
  const home = ROLE_HOME[role] || "/dashboard/student";

  if (pathname.startsWith("/creator")) {
    if (role === "TEACHER" || role === "ADMIN") return NextResponse.next();
    return NextResponse.redirect(new URL(home, req.url));
  }

  if (pathname === "/dashboard") {
    return NextResponse.redirect(new URL(home, req.url));
  }

  if (role === "ADMIN" && pathname.startsWith("/dashboard/admin")) {
    return NextResponse.next();
  }

  if (
    role === "TEACHER" &&
    TEACHER_ALLOWED_PREFIXES.some(p => pathname.startsWith(p))
  ) {
    return NextResponse.next();
  }

  if (!pathname.startsWith(home)) {
    return NextResponse.redirect(new URL(home, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/creator/:path*"],
};
