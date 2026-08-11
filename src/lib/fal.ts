import { fal } from "@fal-ai/client";
import { CATEGORIES } from "./types";

let configured = false;

function ensureConfigured() {
  if (configured) return;
  const key = process.env.FAL_KEY;
  if (!key) {
    throw new Error("FAL_KEY ortam değişkeni tanımlı değil (.env.local).");
  }
  fal.config({ credentials: key });
  configured = true;
}

const VISION_ENDPOINT = "openrouter/router/vision";
const VISION_MODEL = "anthropic/claude-sonnet-5";

const SYSTEM_PROMPT = `Sen bir fiş/fatura okuma asistanısın. Sana verilen fiş fotoğrafını analiz et ve SADECE aşağıdaki alanlardan oluşan geçerli bir JSON nesnesi döndür. Markdown, açıklama veya kod bloğu kullanma, sadece ham JSON döndür.

Alanlar:
- merchant: mağaza/işletme adı (string veya null)
- date: tarih, "YYYY-MM-DD" formatında (string veya null)
- time: saat, "HH:MM" formatında, 24 saat (string veya null)
- category: şu listeden EN UYGUN olanı seç: ${CATEGORIES.join(", ")} (string veya null)
- total: toplam tutar, sayı (number veya null)
- currency: para birimi ISO kodu, örn "TRY", "USD", "EUR" (string veya null)
- tax: KDV/vergi tutarı, sayı (number veya null)
- bankName: fişte görünen banka/kart adı (string veya null)
- items: satın alınan ürünlerin listesi, string dizisi (boşsa [])

Fişte açıkça görünmeyen bir bilgiyi ASLA uydurma; o alanı null bırak. Sadece geçerli JSON döndür, başka hiçbir metin ekleme.`;

export type ExtractedReceipt = {
  merchant: string | null;
  date: string | null;
  time: string | null;
  category: string | null;
  total: number | null;
  currency: string | null;
  tax: number | null;
  bankName: string | null;
  items: string[];
};

function parseJsonFromOutput(output: string): ExtractedReceipt {
  let text = output.trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced) text = fenced[1];
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    text = text.slice(start, end + 1);
  }
  const parsed = JSON.parse(text);
  return {
    merchant: parsed.merchant ?? null,
    date: parsed.date ?? null,
    time: parsed.time ?? null,
    category: parsed.category ?? null,
    total: typeof parsed.total === "number" ? parsed.total : parsed.total ? Number(parsed.total) : null,
    currency: parsed.currency ?? null,
    tax: typeof parsed.tax === "number" ? parsed.tax : parsed.tax ? Number(parsed.tax) : null,
    bankName: parsed.bankName ?? null,
    items: Array.isArray(parsed.items) ? parsed.items.map(String) : [],
  };
}

export async function uploadReceiptImage(file: Blob): Promise<string> {
  ensureConfigured();
  return fal.storage.upload(file);
}

export async function extractReceipt(imageUrl: string): Promise<ExtractedReceipt> {
  ensureConfigured();
  const result = await fal.run(VISION_ENDPOINT, {
    input: {
      image_urls: [imageUrl],
      model: VISION_MODEL,
      system_prompt: SYSTEM_PROMPT,
      prompt: "Bu fiş görselindeki bilgileri çıkar ve şemaya uygun JSON döndür.",
      temperature: 0,
    },
  });
  const data = result.data as { output?: string };
  if (!data?.output) {
    throw new Error("Model boş yanıt döndürdü.");
  }
  return parseJsonFromOutput(data.output);
}
