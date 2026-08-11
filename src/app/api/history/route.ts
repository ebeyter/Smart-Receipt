import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  if (!scriptUrl) {
    return NextResponse.json({ receipts: [] });
  }

  try {
    const upstream = await fetch(`${scriptUrl}?action=history`, {
      cache: "no-store",
    });
    const data = await upstream.json();
    return NextResponse.json({ receipts: data.receipts || [] });
  } catch (err) {
    console.error("[/api/history]", err);
    return NextResponse.json({ receipts: [] });
  }
}
