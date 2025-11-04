import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key");

async function verifyJWT(token) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

export default async function middleware(request) {
  const token = request.cookies.get("auth_token")?.value;
  const url = request.nextUrl.clone();
  
  // Debug logging for production troubleshooting
  console.log('Middleware Debug:', {
    path: url.pathname,
    hasToken: !!token,
    tokenLength: token ? token.length : 0,
    cookies: Object.fromEntries(request.cookies.getAll().map(c => [c.name, c.value.substring(0, 10) + '...']))
  });

  // Allow access to login page and API routes without token
  if (url.pathname === "/login" || url.pathname.startsWith("/api/login")) {
    return NextResponse.next();
  }

  // Check if trying to access admin routes
  if (url.pathname.startsWith("/admin")) {
    if (!token) {
      console.log('No token found, redirecting to login');
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    // Use the verifyJWT function we defined above
    const decoded = await verifyJWT(token);
    if (decoded) {
      console.log('Token verified successfully:', { userId: decoded.userId, role: decoded.role });
      return NextResponse.next();
    } else {
      console.error('JWT verification failed');
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"], // protect these routes
};
