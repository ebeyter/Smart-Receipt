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

const SYSTEM_PROMPT = `Sen bir fiş/fatura okuma asistanısın. Sana verilen fotoğrafı analiz et ve SADECE geçerli bir JSON döndür. Markdown, açıklama veya kod bloğu kullanma, sadece ham JSON döndür.

Bir fotoğrafta birden fazla fiş olabilir (yan yana ya da alt alta duran ayrı fişler).
Her fişi AYRI bir nesne olarak çıkar. Cevabın şu biçimde olmalı:
{"receipts": [ { ...fiş 1... }, { ...fiş 2... } ]}
Tek fiş varsa dizide tek nesne olur. Aynı fişin farklı bölümlerini (başlık, ürün
listesi, alt toplam) ASLA ayrı fiş sayma; yalnızca gerçekten farklı fişleri böl.

Her fiş nesnesinin alanları:
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

function asText(value: unknown): string | null {
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "number") return String(value);
  return null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeReceipt(parsed: Record<string, unknown>): ExtractedReceipt {
  return {
    merchant: asText(parsed.merchant),
    date: asText(parsed.date),
    time: asText(parsed.time),
    category: asText(parsed.category),
    total: asNumber(parsed.total),
    currency: asText(parsed.currency),
    tax: asNumber(parsed.tax),
    bankName: asText(parsed.bankName),
    items: Array.isArray(parsed.items) ? parsed.items.map(String) : [],
  };
}

/**
 * Model normalde {"receipts":[...]} döndürür; tek nesne ya da düz dizi
 * döndürdüğü durumlar için de tolerans var.
 */
function parseJsonFromOutput(output: string): ExtractedReceipt[] {
  let text = output.trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced) text = fenced[1];

  const firstBrace = text.search(/[[{]/);
  const lastBrace = Math.max(text.lastIndexOf("}"), text.lastIndexOf("]"));
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    text = text.slice(firstBrace, lastBrace + 1);
  }

  const parsed = JSON.parse(text);
  const list = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.receipts)
      ? parsed.receipts
      : [parsed];

  const receipts = list
    .filter((item: unknown) => typeof item === "object" && item !== null)
    .map((item: Record<string, unknown>) => normalizeReceipt(item));

  return receipts.length > 0 ? receipts : [normalizeReceipt({})];
}

export async function uploadReceiptImage(file: Blob): Promise<string> {
  ensureConfigured();
  return fal.storage.upload(file);
}

/** Bir fotoğraftaki tüm fişleri döndürür; çoğu zaman tek elemanlı bir dizidir. */
export async function extractReceipts(imageUrl: string): Promise<ExtractedReceipt[]> {
  ensureConfigured();
  const result = await fal.run(VISION_ENDPOINT, {
    input: {
      image_urls: [imageUrl],
      model: VISION_MODEL,
      system_prompt: SYSTEM_PROMPT,
      prompt:
        "Bu fotoğraftaki her fişi ayrı ayrı çıkar ve şemaya uygun JSON döndür.",
      temperature: 0,
    },
  });
  const data = result.data as { output?: string };
  if (!data?.output) {
    throw new Error("Model boş yanıt döndürdü.");
  }
  return parseJsonFromOutput(data.output);
}
