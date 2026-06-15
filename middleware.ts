import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const ROLE_HOME: Record<string, string> = {
  STUDENT: "/dashboard/student",
  TEACHER: "/dashboard/teacher",
  ADMIN: "/dashboard/admin",
  SUPER_ADMIN: "/dashboard/super-admin",
};

export async function middleware(req: NextRequest) {
  console.log("middleware running");
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/dashboard")) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
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

  if (role === "SUPER_ADMIN") return NextResponse.next();

  if (role === "ADMIN" && pathname.startsWith("/dashboard/admin")) {
    return NextResponse.next();
  }

  if (!pathname.startsWith(home)) {
    return NextResponse.redirect(new URL(home, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
