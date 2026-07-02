import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const ROLE_HOME: Record<string, string> = {
  STUDENT: "/dashboard/student",
  TEACHER: "/dashboard/teacher",
  ADMIN: "/dashboard/admin",
};

// TEACHER được phép truy cập các trang này
const TEACHER_ALLOWED = ["/dashboard/teacher", "/creator"];

// ADMIN được phép truy cập các trang này
const ADMIN_ALLOWED = ["/dashboard/admin"];

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

  if (pathname === "/dashboard") {
    return NextResponse.redirect(new URL(home, req.url));
  }

  if (role === "TEACHER" && TEACHER_ALLOWED.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (role === "ADMIN" && ADMIN_ALLOWED.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  if (role === "STUDENT" && pathname.startsWith("/dashboard/student")) {
    return NextResponse.next();
  }

  // Redirect về home nếu không có quyền
  if (!pathname.startsWith(home)) {
    return NextResponse.redirect(new URL(home, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/creator/:path*"],
};
