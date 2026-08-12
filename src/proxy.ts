import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE, isValidSessionToken } from "@/lib/auth";

export function proxy(request: NextRequest) {
  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword) return NextResponse.next();

  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (isValidSessionToken(token, appPassword)) return NextResponse.next();

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/((?!login|api/login|_next/static|_next/image|favicon.ico).*)"],
};
