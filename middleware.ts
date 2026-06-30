import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const ROLE_HOME: Record<string, string> = {
  STUDENT: "/dashboard/student",
  TEACHER: "/dashboard/teacher",
  ADMIN: "/dashboard/admin",
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/login")) return NextResponse.next();
  if (!pathname.startsWith("/dashboard")) return NextResponse.next();

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  });
  console.log("token:", token);
  if (!token) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  const role = (token.role as string) || "STUDENT";
  const home = ROLE_HOME[role] || "/dashboard/student";

  // Redirect /dashboard → role home
  if (pathname === "/dashboard") {
    return NextResponse.redirect(new URL(home, req.url));
  }

  // ADMIN có thể truy cập mọi trang /dashboard/admin/*
  if (role === "ADMIN" && pathname.startsWith("/dashboard/admin")) {
    return NextResponse.next();
  }

  // TEACHER có thể truy cập /dashboard/teacher/* và /dashboard/admin/characters, backgrounds, stories
  if (role === "TEACHER") {
    const teacherAllowed = [
      "/dashboard/teacher",
      "/dashboard/admin/characters",
      "/dashboard/admin/backgrounds",
      "/dashboard/admin/stories",
    ];
    if (teacherAllowed.some(p => pathname.startsWith(p))) {
      return NextResponse.next();
    }
  }

  // Các role khác chỉ truy cập được đúng home của mình
  if (!pathname.startsWith(home)) {
    return NextResponse.redirect(new URL(home, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
