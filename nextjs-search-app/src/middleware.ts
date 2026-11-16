import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { checkSuperUser } from "@/utils/auth";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const { isSuperUser } = checkSuperUser(token);

    if (!isSuperUser) {
      // 1. API routes return a clean JSON 403 Forbidden response (prevents JSON parsing errors)
      if (path.startsWith("/api/admin")) {
        return NextResponse.json(
          { error: "Forbidden: Administrator or Developer privileges required" }, 
          { status: 403 }
        );
      }

      // 2. Browser page visits redirect smoothly to the home page
      return NextResponse.redirect(new URL("/", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

// ONLY protect admin pages and admin APIs. Everything else is public!
export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*"
  ],
};
