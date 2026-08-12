import { createHmac, timingSafeEqual } from "crypto";

export const AUTH_COOKIE = "sr_session";

function sign(password: string): string {
  return createHmac("sha256", password).update("smart-receipt-session").digest("hex");
}

export function createSessionToken(password: string): string {
  return sign(password);
}

export function isValidSessionToken(token: string | undefined, password: string): boolean {
  if (!token) return false;
  const expected = sign(password);
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
