import { auth } from "@/auth";
import { NextResponse } from "next/server";

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

export default auth(req => {
  const { pathname } = req.nextUrl;
  const isProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/creator");
  if (!isProtected) return NextResponse.next();

  const session = req.auth;

  if (!session?.user) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  const role = session.user.role || "STUDENT";
  const home = ROLE_HOME[role] || "/dashboard/student";
  const allowed = ROLE_ALLOWED[role] || [home];

  if (pathname === "/dashboard") {
    return NextResponse.redirect(new URL(home, req.url));
  }

  if (allowed.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL(home, req.url));
});

export const config = {
  matcher: ["/dashboard/:path*", "/creator/:path*"],
};
