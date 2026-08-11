import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  if (!scriptUrl) {
    return NextResponse.json(
      { error: "GOOGLE_APPS_SCRIPT_URL ortam değişkeni tanımlı değil." },
      { status: 500 }
    );
  }

  try {
    const body = await request.text();
    const upstream = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    const data = await upstream.json();

    if (!data.success) {
      return NextResponse.json(
        { error: data.error || "Google Sheets'e gönderilemedi." },
        { status: 502 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[/api/submit]", err);
    return NextResponse.json(
      { error: "Google Apps Script'e ulaşılamadı." },
      { status: 502 }
    );
  }
}
