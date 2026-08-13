"use client";

import { useMemo, useState } from "react";
import { CATEGORY_META } from "@/lib/categories";
import { formatDate, formatMoney } from "@/lib/format";
import { useSettings } from "@/components/SettingsProvider";
import { CardStripe } from "@/components/ui/card-stripe";
import { useT } from "@/lib/i18n";
import type { SavedReceipt } from "@/lib/types";

type Props = {
  items: SavedReceipt[];
  isLoading?: boolean;
  monthlyBudget?: number | null;
  monthlyIncome?: number | null;
};

const RADIUS = 60;
const STROKE = 16;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 4; // px surface gap between donut segments

export default function SummaryPanel({
  items,
  isLoading,
  monthlyBudget,
  monthlyIncome,
}: Props) {
  const { t, locale, category: categoryLabel } = useT();
  const { settings } = useSettings();

  // Sheet'teki named range öncelikli; boş ya da 0 ise Ayarlar'daki değere düşer.
  const positive = (value: number | null | undefined) => (value && value > 0 ? value : null);
  const income = positive(monthlyIncome) ?? positive(settings.monthlyIncome);
  const budget = positive(monthlyBudget) ?? positive(settings.monthlyBudget);
  const [hovered, setHovered] = useState<string | null>(null);
  const [showTable, setShowTable] = useState(false);

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthLabel = new Intl.DateTimeFormat(locale, {
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
      <section className="relative overflow-hidden rounded-2xl border border-border bg-surface/85 p-5 pl-6 shadow-sm backdrop-blur">
        <CardStripe tint="var(--primary)" />
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">{t("summary.monthly")}</h2>
          <span className="text-sm capitalize text-muted">{monthLabel}</span>
        </div>
        <p className="money mt-2 text-2xl font-semibold tracking-tight text-foreground">
          {formatMoney(monthTotal, currency, locale)}
        </p>
        <p className="mt-0.5 text-sm text-muted">
          {t("summary.scanned", { count: monthItems.length })}
        </p>
      </section>

      {income != null && income > 0 && (
        <FinancialPlanningCard
          monthLabel={monthLabel}
          income={income}
          spend={monthTotal}
          budget={budget}
        />
      )}

      <section className="relative overflow-hidden rounded-2xl border border-border bg-surface/85 p-5 pl-6 shadow-sm backdrop-blur">
        <CardStripe tint="var(--cat-3)" />
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">{t("summary.categories")}</h2>
          {breakdown.length > 0 && (
            <button
              type="button"
              onClick={() => setShowTable((v) => !v)}
              className="text-xs font-medium text-primary hover:underline"
            >
              {showTable ? t("summary.chartView") : t("summary.tableView")}
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="mt-6 flex justify-center">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
          </div>
        ) : breakdown.length === 0 ? (
          <p className="mt-4 text-sm text-muted">{t("summary.noRecords")}</p>
        ) : showTable ? (
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-muted">
                <th className="pb-2 font-medium">{t("summary.category")}</th>
                <th className="pb-2 text-right font-medium">{t("summary.amount")}</th>
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
                    {categoryLabel(b.category)}
                  </td>
                  <td className="money py-1.5 text-right font-medium text-foreground">
                    {formatMoney(b.total, currency, locale)}
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
                <span className="text-xs text-muted">
                  {hovered ? categoryLabel(hovered) : t("summary.total")}
                </span>
                <span className="text-base font-semibold text-foreground">
                  {hovered
                    ? `${((breakdown.find((b) => b.category === hovered)!.total / monthTotal) * 100).toFixed(0)}%`
                    : formatMoney(monthTotal, currency, locale)}
                </span>
              </div>
            </div>

            <ul className="flex w-full flex-col gap-1.5">
              {breakdown.slice(0, 6).map((b, idx) => (
                <li
                  key={b.category}
                  onMouseEnter={() => setHovered(b.category)}
                  onMouseLeave={() => setHovered(null)}
                  className="flex items-center justify-between rounded-md px-1.5 py-1 text-sm transition-colors hover:bg-surface-muted"
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
                    {categoryLabel(b.category)}
                  </span>
                  <span className="money font-medium text-muted">
                    {formatMoney(b.total, currency, locale)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="relative overflow-hidden rounded-2xl border border-border bg-surface/85 p-5 pl-6 shadow-sm backdrop-blur">
        <CardStripe tint="var(--cat-7)" />
        <h2 className="text-base font-semibold text-foreground">{t("summary.recent")}</h2>
        {recent.length === 0 ? (
          <p className="mt-3 text-sm text-muted">{t("summary.noRecent")}</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2.5">
            {recent.map((r, idx) => (
              <li key={`${r.merchant}-${r.uploadedAt}-${idx}`} className="flex items-center gap-3">
                <ReceiptThumb receipt={r} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {r.merchant || t("summary.unknown")}
                  </p>
                  <p className="text-xs text-muted">
                    {categoryLabel(r.category || "Diğer")} · {formatDate(r.date, locale)}
                  </p>
                </div>
                <span className="money shrink-0 text-sm font-semibold text-foreground">
                  {formatMoney(r.total, r.currency || "TRY", locale)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function FinancialPlanningCard({
  monthLabel,
  income,
  spend,
  budget,
}: {
  monthLabel: string;
  income: number;
  spend: number;
  budget: number | null;
}) {
  const { t, locale } = useT();
  const remaining = income - spend;
  const over = spend > income;
  const barWidth = Math.min((spend / income) * 100, 100);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-surface/85 p-5 pl-6 shadow-sm backdrop-blur">
        <CardStripe tint="var(--cat-4)" />
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">{t("summary.planning")}</h2>
        <span className="text-sm capitalize text-muted">{monthLabel}</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <p className="text-sm text-muted">{t("summary.income")}</p>
          <p className="money text-base font-semibold text-foreground">
            {formatMoney(income, "TRY", locale)}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted">{t("summary.spend")}</p>
          <p className="money text-base font-semibold text-foreground">
            {formatMoney(spend, "TRY", locale)}
          </p>
        </div>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-2 rounded-full transition-[width]"
          style={{
            width: `${barWidth}%`,
            background: over ? "var(--danger)" : "var(--primary)",
          }}
        />
      </div>

      <p
        className={`mt-2 text-sm font-medium ${over ? "text-danger" : "text-primary"}`}
      >
        {over
          ? t("summary.over", { amount: formatMoney(Math.abs(remaining), "TRY", locale) })
          : t("summary.remaining", { amount: formatMoney(remaining, "TRY", locale) })}
      </p>

      {budget != null && (
        <p className="mt-1 text-xs text-muted">
          {t("summary.budget", { amount: formatMoney(budget, "TRY", locale) })}
        </p>
      )}
    </section>
  );
}

function ReceiptThumb({ receipt }: { receipt: SavedReceipt }) {
  const [failed, setFailed] = useState(false);
  const meta = CATEGORY_META[receipt.category as keyof typeof CATEGORY_META];

  if (receipt.receiptImageUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={receipt.receiptImageUrl}
        alt={`${receipt.merchant || "Fiş"} görseli`}
        onError={() => setFailed(true)}
        className="h-8 w-8 shrink-0 rounded-lg object-cover"
      />
    );
  }

  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base"
      style={{
        background: meta?.colorVar ?? "var(--muted)",
        opacity: 0.16,
      }}
    >
      {meta?.icon ?? "🧾"}
    </span>
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
