export function formatMoney(value: number, currency: string, locale = "tr-TR") {
  const symbol = currency === "TRY" ? "₺" : "";
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return symbol ? `${symbol}${formatted}` : `${formatted} ${currency}`;
}

export function formatDate(dateStr: string, locale = "tr-TR") {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}
