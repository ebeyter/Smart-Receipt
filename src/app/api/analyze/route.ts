import { NextResponse } from "next/server";
import { extractReceipt, uploadReceiptImage } from "@/lib/fal";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("image");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "Görsel bulunamadı." },
        { status: 400 }
      );
    }

    const imageUrl = await uploadReceiptImage(file);
    const extracted = await extractReceipt(imageUrl);

    return NextResponse.json({ imageUrl, extracted });
  } catch (err) {
    console.error("[/api/analyze]", err);
    const message =
      err instanceof Error ? err.message : "Fiş analiz edilirken hata oluştu.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
