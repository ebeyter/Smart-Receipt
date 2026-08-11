import type { Category } from "./types";

export const CATEGORY_META: Record<
  Category,
  { icon: string; colorVar: string }
> = {
  Market: { icon: "🛒", colorVar: "var(--cat-1)" },
  Yemek: { icon: "🍽️", colorVar: "var(--cat-2)" },
  Ulaşım: { icon: "🚌", colorVar: "var(--cat-3)" },
  Alışveriş: { icon: "🛍️", colorVar: "var(--cat-4)" },
  Sağlık: { icon: "💊", colorVar: "var(--cat-5)" },
  Eğitim: { icon: "🎓", colorVar: "var(--cat-6)" },
  Eğlence: { icon: "🎬", colorVar: "var(--cat-7)" },
  Fatura: { icon: "🧾", colorVar: "var(--cat-8)" },
  Diğer: { icon: "🏷️", colorVar: "var(--muted)" },
};
