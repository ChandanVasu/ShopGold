import { NextResponse } from "next/server";

export default async function middleware(request) {
  const token = request.cookies.get("auth_token")?.value;
  const url = request.nextUrl.clone();

  // Debug logging for production troubleshooting
  console.log("Middleware Debug:", {
    path: url.pathname,
    hasToken: !!token,
    tokenLength: token ? token.length : 0,
    cookies: Object.fromEntries(request.cookies.getAll().map((c) => [c.name, c.value.substring(0, 10) + "..."])),
  });

  // Allow access to login page and API routes without token
  if (url.pathname === "/login" || url.pathname.startsWith("/api/login")) {
    return NextResponse.next();
  }

  // Check if trying to access admin routes
  if (url.pathname.startsWith("/admin")) {
    if (!token) {
      console.log("No token found, redirecting to login");
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    // Simple token check - just verify token exists (no JWT verification)
    if (token && token.length > 0) {
      console.log("Token found, allowing access to admin");
      return NextResponse.next();
    } else {
      console.log("Invalid token, redirecting to login");
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"], // protect these routes
};
