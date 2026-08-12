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

    // Apps Script web apps answer POST requests with a 302 to a one-time-use
    // googleusercontent.com URL; the actual JSON only shows up if that
    // redirect is followed with a plain GET. Letting fetch auto-follow it
    // re-sends our POST and Apps Script answers with an error page instead
    // of JSON — so the redirect is handled manually here.
    let upstream = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      redirect: "manual",
    });

    if (upstream.status >= 300 && upstream.status < 400) {
      const location = upstream.headers.get("location");
      if (!location) {
        throw new Error("Apps Script yönlendirme adresi bulunamadı.");
      }
      upstream = await fetch(location);
    }

    if (!upstream.ok) {
      throw new Error(`Apps Script beklenmeyen durum kodu döndürdü: ${upstream.status}`);
    }

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
    const message =
      err instanceof Error ? err.message : "Google Apps Script'e ulaşılamadı.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
