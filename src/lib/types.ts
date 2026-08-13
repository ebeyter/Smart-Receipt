export const CATEGORIES = [
  "Market",
  "Yemek",
  "Ulaşım",
  "Alışveriş",
  "Sağlık",
  "Eğitim",
  "Eğlence",
  "Fatura",
  "Diğer",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type ReceiptStatus = "pending" | "analyzing" | "ready" | "error";

export type Receipt = {
  id: string;
  status: ReceiptStatus;
  error?: string;
  /** Aynı fotoğraftan bölünen fişler bu kimliği paylaşır. */
  groupId?: string;
  /** Fotoğrafta birden fazla fiş bulunduysa kaçıncısı olduğu (1/3 gibi). */
  part?: { index: number; total: number };
  file: File;
  imageDataUrl: string;
  fileName: string;
  merchant: string;
  date: string;
  time: string;
  category: Category | "";
  total: string;
  currency: string;
  tax: string;
  bankName: string;
  items: string[];
};

export type SavedReceipt = {
  merchant: string;
  date: string;
  time: string;
  category: string;
  total: number;
  currency: string;
  tax: string;
  bankName: string;
  items: string[];
  receiptImageUrl: string;
  uploadedAt: string;
};
