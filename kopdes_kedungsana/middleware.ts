import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Check if trying to access the admin panel
  if (request.nextUrl.pathname.startsWith("/admin")) {
    const authCookie = request.cookies.get("kopdes_admin_session");

    // If cookie doesn't exist, redirect to login page
    if (!authCookie || authCookie.value !== "authenticated") {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Allow request to continue
  return NextResponse.next();
}

export const config = {
  // Match all request paths starting with /admin
  matcher: "/admin/:path*",
};
