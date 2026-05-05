import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/auth";

const protectedRoutes = [
  "/",
  "/orders",
  "/designer",
  "/production",
  "/shipping",
  "/jax",
  "/history",
  "/designs",
  "/accounting",
  "/settings",
];

const roleAccess: Record<string, string[]> = {
  ADMIN: ["/", "/orders", "/designer", "/production", "/shipping", "/jax", "/history", "/designs", "/accounting", "/settings"],
  MODERATOR: ["/orders", "/designer", "/production", "/shipping", "/jax", "/designs"],
  DESIGNER: ["/designer", "/designs"],
};

const publicRoutes = ["/login"];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some((route) => path === route || path.startsWith(route + "/"));
  const isPublicRoute = publicRoutes.includes(path);

  const cookie = req.cookies.get("session")?.value;
  const session = cookie ? await decrypt(cookie).catch(() => null) : null;

  if (isProtectedRoute) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.nextUrl));
    }

    const userRole = session.user?.role;
    const allowedPaths = roleAccess[userRole] || [];
    
    // Check if the current path or its parent is allowed
    const isAllowed = allowedPaths.some(allowedPath => 
      path === allowedPath || path.startsWith(allowedPath + "/")
    );

    if (!isAllowed) {
      // Redirect to the first allowed page for this role
      const fallback = allowedPaths[0] || "/login";
      return NextResponse.redirect(new URL(fallback, req.nextUrl));
    }
  }

  if (isPublicRoute && session) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
