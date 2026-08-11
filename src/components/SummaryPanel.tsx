"use client";

import { useMemo, useState } from "react";
import { CATEGORY_META } from "@/lib/categories";
import { formatDate, formatMoney } from "@/lib/format";
import type { SavedReceipt } from "@/lib/types";

type Props = {
  items: SavedReceipt[];
  isLoading?: boolean;
};

const RADIUS = 60;
const STROKE = 16;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 4; // px surface gap between donut segments

export default function SummaryPanel({ items, isLoading }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [showTable, setShowTable] = useState(false);

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthLabel = new Intl.DateTimeFormat("tr-TR", {
    month: "long",
    year: "numeric",
  }).format(now);

  const monthItems = useMemo(
    () => items.filter((i) => i.date?.startsWith(monthKey)),
    [items, monthKey]
  );

  const currency = monthItems[0]?.currency || "TRY";
  const monthTotal = monthItems.reduce((sum, i) => sum + (i.total || 0), 0);

  const breakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const i of monthItems) {
      const cat = i.category || "Diğer";
      map.set(cat, (map.get(cat) || 0) + i.total);
    }
    return Array.from(map.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  }, [monthItems]);

  const recent = [...items]
    .sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1))
    .slice(0, 5);

  const segments = useMemo(() => {
    return breakdown.reduce<
      Array<{ category: string; total: number; segLen: number; offset: number }>
    >((acc, b) => {
      const cumulative = acc.reduce((sum, s) => sum + s.segLen, 0);
      const fraction = b.total / monthTotal;
      const segLen = fraction * CIRCUMFERENCE;
      return [...acc, { ...b, segLen, offset: -cumulative }];
    }, []);
  }, [breakdown, monthTotal]);

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Aylık Özet
          </h2>
          <span className="text-xs capitalize text-muted">{monthLabel}</span>
        </div>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
          {formatMoney(monthTotal, currency)}
        </p>
        <p className="mt-0.5 text-xs text-muted">
          {monthItems.length} fiş tarandı
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Kategori Dağılımı
          </h2>
          {breakdown.length > 0 && (
            <button
              type="button"
              onClick={() => setShowTable((v) => !v)}
              className="text-[11px] font-medium text-primary hover:underline"
            >
              {showTable ? "Grafiği göster" : "Tablo görünümü"}
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="mt-6 flex justify-center">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
          </div>
        ) : breakdown.length === 0 ? (
          <p className="mt-4 text-xs text-muted">
            Bu ay için henüz kayıt yok.
          </p>
        ) : showTable ? (
          <table className="mt-4 w-full text-xs">
            <thead>
              <tr className="text-left text-[10px] uppercase text-muted">
                <th className="pb-2 font-medium">Kategori</th>
                <th className="pb-2 text-right font-medium">Tutar</th>
                <th className="pb-2 text-right font-medium">%</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.map((b, idx) => (
                <tr key={b.category} className="border-t border-border">
                  <td className="flex items-center gap-1.5 py-1.5">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        background:
                          CATEGORY_META[
                            b.category as keyof typeof CATEGORY_META
                          ]?.colorVar ?? categoryFallback(idx),
                      }}
                    />
                    {b.category}
                  </td>
                  <td className="py-1.5 text-right font-medium text-foreground">
                    {formatMoney(b.total, currency)}
                  </td>
                  <td className="py-1.5 text-right text-muted">
                    {((b.total / monthTotal) * 100).toFixed(0)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
            <div className="relative shrink-0">
              <svg
                width={RADIUS * 2 + STROKE}
                height={RADIUS * 2 + STROKE}
                viewBox={`0 0 ${RADIUS * 2 + STROKE} ${RADIUS * 2 + STROKE}`}
              >
                <g
                  transform={`translate(${RADIUS + STROKE / 2}, ${RADIUS + STROKE / 2}) rotate(-90)`}
                >
                  <circle
                    r={RADIUS}
                    fill="none"
                    stroke="var(--surface-muted)"
                    strokeWidth={STROKE}
                  />
                  {segments.map((b, idx) => {
                    const { segLen, offset } = b;
                    const color =
                      CATEGORY_META[b.category as keyof typeof CATEGORY_META]
                        ?.colorVar ?? categoryFallback(idx);
                    const isHovered = hovered === b.category;
                    return (
                      <circle
                        key={b.category}
                        r={RADIUS}
                        fill="none"
                        stroke={color}
                        strokeWidth={isHovered ? STROKE + 3 : STROKE}
                        strokeDasharray={`${Math.max(segLen - GAP, 0)} ${CIRCUMFERENCE - segLen + GAP}`}
                        strokeDashoffset={offset}
                        style={{ transition: "stroke-width 120ms ease" }}
                        onMouseEnter={() => setHovered(b.category)}
                        onMouseLeave={() => setHovered(null)}
                      >
                        <title>
                          {`${b.category}: ${formatMoney(b.total, currency)} (${((b.total / monthTotal) * 100).toFixed(0)}%)`}
                        </title>
                      </circle>
                    );
                  })}
                </g>
              </svg>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] text-muted">
                  {hovered ?? "Toplam"}
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {hovered
                    ? `${((breakdown.find((b) => b.category === hovered)!.total / monthTotal) * 100).toFixed(0)}%`
                    : formatMoney(monthTotal, currency)}
                </span>
              </div>
            </div>

            <ul className="flex w-full flex-col gap-1.5">
              {breakdown.slice(0, 6).map((b, idx) => (
                <li
                  key={b.category}
                  onMouseEnter={() => setHovered(b.category)}
                  onMouseLeave={() => setHovered(null)}
                  className="flex items-center justify-between rounded-md px-1.5 py-1 text-xs transition-colors hover:bg-surface-muted"
                >
                  <span className="flex items-center gap-1.5 text-foreground">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        background:
                          CATEGORY_META[
                            b.category as keyof typeof CATEGORY_META
                          ]?.colorVar ?? categoryFallback(idx),
                      }}
                    />
                    {b.category}
                  </span>
                  <span className="font-medium text-muted">
                    {formatMoney(b.total, currency)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-foreground">
          Son Kayıtlar
        </h2>
        {recent.length === 0 ? (
          <p className="mt-3 text-xs text-muted">Henüz gönderilmiş fiş yok.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2.5">
            {recent.map((r, idx) => (
              <li key={`${r.merchant}-${r.uploadedAt}-${idx}`} className="flex items-center gap-3">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm"
                  style={{
                    background:
                      CATEGORY_META[r.category as keyof typeof CATEGORY_META]
                        ?.colorVar ?? "var(--muted)",
                    opacity: 0.16,
                  }}
                >
                  {CATEGORY_META[r.category as keyof typeof CATEGORY_META]
                    ?.icon ?? "🧾"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground">
                    {r.merchant || "Bilinmeyen"}
                  </p>
                  <p className="text-[11px] text-muted">
                    {r.category || "Diğer"} · {formatDate(r.date)}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-semibold text-foreground">
                  {formatMoney(r.total, r.currency || "TRY")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function categoryFallback(idx: number) {
  const fallbacks = [
    "var(--cat-1)",
    "var(--cat-2)",
    "var(--cat-3)",
    "var(--cat-4)",
    "var(--cat-5)",
    "var(--cat-6)",
    "var(--cat-7)",
    "var(--cat-8)",
  ];
  return fallbacks[idx % fallbacks.length];
}
