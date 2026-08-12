import { NextResponse } from "next/server";
import { AUTH_COOKIE, createSessionToken } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword) {
    return NextResponse.json(
      { error: "APP_PASSWORD ortam değişkeni tanımlı değil." },
      { status: 500 }
    );
  }

  const { password } = await request.json().catch(() => ({ password: "" }));

  if (typeof password !== "string" || password !== appPassword) {
    return NextResponse.json({ error: "Şifre yanlış." }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(AUTH_COOKIE, createSessionToken(appPassword), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
