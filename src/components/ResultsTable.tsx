"use client";

import type { Receipt } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";
import { formatMoney } from "@/lib/format";

type Field = keyof Pick<
  Receipt,
  | "merchant"
  | "date"
  | "time"
  | "category"
  | "total"
  | "currency"
  | "tax"
  | "bankName"
>;

type Props = {
  receipts: Receipt[];
  onChange: (id: string, field: Field, value: string) => void;
  onItemsChange: (id: string, items: string[]) => void;
  onRemove: (id: string) => void;
};

const inputClass =
  "w-full rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";

export default function ResultsTable({
  receipts,
  onChange,
  onItemsChange,
  onRemove,
}: Props) {
  const visible = receipts.filter((r) => r.status !== "pending");
  if (visible.length === 0) return null;

  const total = visible
    .filter((r) => r.status === "ready")
    .reduce((sum, r) => sum + (parseFloat(r.total) || 0), 0);
  const currency = visible.find((r) => r.currency)?.currency || "TRY";

  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">
          Sonuçları Kontrol Et
        </h2>
        <span className="text-xs text-muted">{visible.length} fiş</span>
      </div>

      {/* Desktop table */}
      <div className="mt-4 hidden overflow-x-auto md:block">
        <table className="w-full min-w-[900px] border-separate border-spacing-y-2 text-left">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-muted">
              <th className="px-2 font-medium">Mağaza</th>
              <th className="px-2 font-medium">Tarih</th>
              <th className="px-2 font-medium">Saat</th>
              <th className="px-2 font-medium">Kategori</th>
              <th className="px-2 font-medium">Tutar</th>
              <th className="px-2 font-medium">Para Birimi</th>
              <th className="px-2 font-medium">Vergi</th>
              <th className="px-2 font-medium">Banka</th>
              <th className="px-2 font-medium">Ürünler</th>
              <th className="px-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.id} className="align-top">
                <td className="rounded-l-lg bg-surface-muted px-2 py-2">
                  <input
                    className={inputClass}
                    value={r.merchant}
                    placeholder="Mağaza"
                    onChange={(e) => onChange(r.id, "merchant", e.target.value)}
                  />
                </td>
                <td className="bg-surface-muted px-2 py-2">
                  <input
                    type="date"
                    className={inputClass}
                    value={r.date}
                    onChange={(e) => onChange(r.id, "date", e.target.value)}
                  />
                </td>
                <td className="bg-surface-muted px-2 py-2">
                  <input
                    type="time"
                    className={inputClass}
                    value={r.time}
                    onChange={(e) => onChange(r.id, "time", e.target.value)}
                  />
                </td>
                <td className="bg-surface-muted px-2 py-2">
                  <select
                    className={inputClass}
                    value={r.category}
                    onChange={(e) => onChange(r.id, "category", e.target.value)}
                  >
                    <option value="">Seç…</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="bg-surface-muted px-2 py-2">
                  <input
                    className={`${inputClass} font-medium`}
                    value={r.total}
                    placeholder="0.00"
                    onChange={(e) => onChange(r.id, "total", e.target.value)}
                  />
                </td>
                <td className="bg-surface-muted px-2 py-2">
                  <input
                    className={inputClass}
                    value={r.currency}
                    placeholder="TRY"
                    onChange={(e) => onChange(r.id, "currency", e.target.value)}
                  />
                </td>
                <td className="bg-surface-muted px-2 py-2">
                  <input
                    className={inputClass}
                    value={r.tax}
                    placeholder="—"
                    onChange={(e) => onChange(r.id, "tax", e.target.value)}
                  />
                </td>
                <td className="bg-surface-muted px-2 py-2">
                  <input
                    className={inputClass}
                    value={r.bankName}
                    placeholder="—"
                    onChange={(e) => onChange(r.id, "bankName", e.target.value)}
                  />
                </td>
                <td className="bg-surface-muted px-2 py-2">
                  <input
                    className={inputClass}
                    value={r.items.join(", ")}
                    placeholder="ürün, ürün"
                    onChange={(e) =>
                      onItemsChange(
                        r.id,
                        e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean)
                      )
                    }
                  />
                </td>
                <td className="rounded-r-lg bg-surface-muted px-2 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => onRemove(r.id)}
                    aria-label="Fişi sil"
                    className="rounded-md p-1.5 text-muted transition-colors hover:bg-danger-soft hover:text-danger"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="mt-4 flex flex-col gap-3 md:hidden">
        {visible.map((r) => (
          <div
            key={r.id}
            className="rounded-xl border border-border bg-surface-muted p-3"
          >
            <div className="flex items-center justify-between">
              <input
                className={`${inputClass} font-medium`}
                value={r.merchant}
                placeholder="Mağaza"
                onChange={(e) => onChange(r.id, "merchant", e.target.value)}
              />
              <button
                type="button"
                onClick={() => onRemove(r.id)}
                aria-label="Fişi sil"
                className="ml-2 shrink-0 rounded-md p-1.5 text-muted hover:bg-danger-soft hover:text-danger"
              >
                🗑️
              </button>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="text-[10px] text-muted">
                Tarih
                <input
                  type="date"
                  className={`${inputClass} mt-0.5`}
                  value={r.date}
                  onChange={(e) => onChange(r.id, "date", e.target.value)}
                />
              </label>
              <label className="text-[10px] text-muted">
                Saat
                <input
                  type="time"
                  className={`${inputClass} mt-0.5`}
                  value={r.time}
                  onChange={(e) => onChange(r.id, "time", e.target.value)}
                />
              </label>
              <label className="text-[10px] text-muted">
                Kategori
                <select
                  className={`${inputClass} mt-0.5`}
                  value={r.category}
                  onChange={(e) => onChange(r.id, "category", e.target.value)}
                >
                  <option value="">Seç…</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-[10px] text-muted">
                Tutar
                <input
                  className={`${inputClass} mt-0.5`}
                  value={r.total}
                  placeholder="0.00"
                  onChange={(e) => onChange(r.id, "total", e.target.value)}
                />
              </label>
              <label className="text-[10px] text-muted">
                Para Birimi
                <input
                  className={`${inputClass} mt-0.5`}
                  value={r.currency}
                  placeholder="TRY"
                  onChange={(e) => onChange(r.id, "currency", e.target.value)}
                />
              </label>
              <label className="text-[10px] text-muted">
                Vergi
                <input
                  className={`${inputClass} mt-0.5`}
                  value={r.tax}
                  placeholder="—"
                  onChange={(e) => onChange(r.id, "tax", e.target.value)}
                />
              </label>
              <label className="col-span-2 text-[10px] text-muted">
                Banka
                <input
                  className={`${inputClass} mt-0.5`}
                  value={r.bankName}
                  placeholder="—"
                  onChange={(e) => onChange(r.id, "bankName", e.target.value)}
                />
              </label>
              <label className="col-span-2 text-[10px] text-muted">
                Ürünler
                <input
                  className={`${inputClass} mt-0.5`}
                  value={r.items.join(", ")}
                  placeholder="ürün, ürün"
                  onChange={(e) =>
                    onItemsChange(
                      r.id,
                      e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean)
                    )
                  }
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <span className="text-xs text-muted">Toplam Tutar</span>
        <span className="text-sm font-semibold text-foreground">
          {formatMoney(total, currency)}
        </span>
      </div>
    </section>
  );
}
