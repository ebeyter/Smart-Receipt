"use client";

import { useEffect, useMemo, useState } from "react";
import { useSettings } from "@/components/SettingsProvider";
import { CardStripe } from "@/components/ui/card-stripe";
import { CATEGORY_META } from "@/lib/categories";
import { formatMoney } from "@/lib/format";
import { useT } from "@/lib/i18n";
import type { SavedReceipt } from "@/lib/types";

type History = {
  receipts: SavedReceipt[];
  monthlyIncome: number | null;
  monthlyBudget: number | null;
};

export default function PlanPage() {
  const { settings, update } = useSettings();
  const { t, locale, category: categoryLabel } = useT();
  const history = useHistory();

  const positive = (value: number | null | undefined) => (value && value > 0 ? value : null);
  // Burada girilen değer önceliklidir; boşsa Sheet'teki named range kullanılır.
  const sheetIncome = positive(history?.monthlyIncome);
  const sheetBudget = positive(history?.monthlyBudget);
  const income = positive(settings.monthlyIncome) ?? sheetIncome;
  const budget = positive(settings.monthlyBudget) ?? sheetBudget;

  const receipts = useMemo(() => history?.receipts ?? [], [history]);
  const monthKey = currentMonthKey();
  const monthItems = useMemo(
    () => receipts.filter((r) => r.date?.startsWith(monthKey)),
    [receipts, monthKey]
  );

  const spend = monthItems.reduce((sum, r) => sum + (r.total || 0), 0);
  const remaining = income != null ? income - spend : null;
  const isOverIncome = remaining != null && remaining < 0;
  const isOverBudget = budget != null && spend > budget;

  const months = useMemo(() => lastSixMonths(receipts, locale), [receipts, locale]);
  const peak = Math.max(...months.map((month) => month.total), 0);
  const categories = useMemo(() => byCategory(monthItems), [monthItems]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="sr-rise">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          {t("plan.title")}
        </h1>
        <p className="mt-1 text-base text-muted">{t("plan.subtitle")}</p>
      </div>

      <section className="sr-rise relative grid gap-3 overflow-hidden rounded-2xl border border-border bg-surface/85 p-5 pl-6 shadow-sm backdrop-blur sm:grid-cols-2">
        <CardStripe tint="var(--primary)" />
        <AmountField
          label={t("plan.income")}
          value={settings.monthlyIncome}
          onChange={(value) => update({ monthlyIncome: value })}
          hint={
            sheetIncome != null && !positive(settings.monthlyIncome)
              ? t("plan.fromSheet", { amount: formatMoney(sheetIncome, "TRY", locale) })
              : undefined
          }
        />
        <AmountField
          label={`${t("plan.budget")} (${t("plan.budgetOptional")})`}
          value={settings.monthlyBudget}
          onChange={(value) => update({ monthlyBudget: value })}
          hint={
            sheetBudget != null && !positive(settings.monthlyBudget)
              ? t("plan.fromSheet", { amount: formatMoney(sheetBudget, "TRY", locale) })
              : undefined
          }
        />
      </section>

      <section className="sr-rise grid gap-3 sm:grid-cols-3">
        <StatTile
          label={t("plan.income")}
          value={income != null ? formatMoney(income, "TRY", locale) : "—"}
          tint="var(--cat-3)"
        />
        <StatTile
          label={t("plan.spend")}
          value={formatMoney(spend, "TRY", locale)}
          tint="var(--cat-2)"
        />
        <StatTile
          label={isOverIncome ? t("plan.overspent") : t("plan.remaining")}
          value={remaining != null ? formatMoney(Math.abs(remaining), "TRY", locale) : "—"}
          tint={isOverIncome ? "var(--danger)" : "var(--success)"}
        />
      </section>

      <section className="sr-rise relative overflow-hidden rounded-2xl border border-border bg-surface/85 p-5 pl-6 shadow-sm backdrop-blur">
        <CardStripe tint="var(--cat-3)" />
        {income == null ? (
          <p className="text-base text-muted">{t("plan.noIncome")}</p>
        ) : (
          <>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm text-muted">
                {t("plan.ofIncome", { percent: Math.round((spend / income) * 100) })}
              </span>
              {budget != null && (
                <span className={`text-sm ${isOverBudget ? "text-danger" : "text-muted"}`}>
                  {t("plan.budgetUsed", { percent: Math.round((spend / budget) * 100) })}
                </span>
              )}
            </div>

            <div className="relative mt-3 h-3 overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-3 rounded-full transition-[width] duration-700"
                style={{
                  width: `${Math.min((spend / income) * 100, 100)}%`,
                  background: isOverIncome ? "var(--danger)" : "var(--primary)",
                }}
              />
              {budget != null && budget < income && (
                <span
                  aria-hidden
                  className="absolute top-0 h-3 w-0.5 bg-foreground/50"
                  style={{ left: `${Math.min((budget / income) * 100, 100)}%` }}
                />
              )}
            </div>

            <p
              className={`mt-3 text-base font-medium ${
                isOverBudget || isOverIncome ? "text-danger" : "text-success"
              }`}
            >
              {isOverBudget && budget != null
                ? t("plan.overBudget", { amount: formatMoney(spend - budget, "TRY", locale) })
                : t("plan.onTrack")}
            </p>

            {remaining != null && remaining > 0 && income > 0 && (
              <p className="mt-1 text-sm text-muted">
                {t("plan.savingRate")}: %{Math.round((remaining / income) * 100)}
              </p>
            )}
          </>
        )}
      </section>

      <section className="sr-rise relative overflow-hidden rounded-2xl border border-border bg-surface/85 p-5 pl-6 shadow-sm backdrop-blur">
        <CardStripe tint="var(--cat-7)" />
        <h2 className="font-display text-base font-semibold text-foreground">{t("plan.trend")}</h2>

        {/* Tek serili sütun grafiği: tek renk, tabana oturan 4px yuvarlak uçlar,
            etiket yalnızca zirve ve içinde bulunulan ayda, gerisi hover'da. */}
        <div className="mt-6">
          <div className="flex h-44 items-end gap-2">
            {months.map((month) => {
              const isCurrent = month.key === monthKey;
              const isPeak = peak > 0 && month.total === peak;
              const barPercent = peak > 0 ? Math.max((month.total / peak) * 100, month.total > 0 ? 4 : 1.5) : 1.5;

              return (
                <div key={month.key} className="group relative flex h-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-[4px] transition-[height] duration-700 ease-out"
                    style={{
                      height: `${barPercent}%`,
                      background: isCurrent
                        ? "var(--primary)"
                        : "color-mix(in oklab, var(--primary) 30%, transparent)",
                    }}
                  />

                  {(isPeak || isCurrent) && month.total > 0 && (
                    <span
                      className="money pointer-events-none absolute inset-x-0 text-center text-xs text-muted"
                      style={{ bottom: `calc(${barPercent}% + 6px)` }}
                    >
                      {compactMoney(month.total, locale)}
                    </span>
                  )}

                  <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                    <span className="capitalize">{month.label}</span>{" "}
                    <span className="money font-medium">
                      {formatMoney(month.total, "TRY", locale)}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>

          <div className="border-t border-border" />

          <div className="mt-2 flex gap-2">
            {months.map((month) => (
              <span
                key={month.key}
                className={`flex-1 text-center text-xs capitalize ${
                  month.key === monthKey ? "font-medium text-foreground" : "text-muted"
                }`}
              >
                {month.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="sr-rise relative overflow-hidden rounded-2xl border border-border bg-surface/85 p-5 pl-6 shadow-sm backdrop-blur">
        <CardStripe tint="var(--cat-4)" />
        <h2 className="font-display text-base font-semibold text-foreground">
          {t("plan.categories")}
        </h2>

        {categories.length === 0 ? (
          <p className="mt-3 text-base text-muted">{t("plan.noData")}</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {categories.map((entry) => (
              <li key={entry.category}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 text-foreground">
                    <span>{CATEGORY_META[entry.category as keyof typeof CATEGORY_META]?.icon ?? "🏷️"}</span>
                    {categoryLabel(entry.category)}
                  </span>
                  <span className="money font-medium text-foreground">
                    {formatMoney(entry.total, "TRY", locale)}
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className="h-2 rounded-full transition-[width] duration-700"
                    style={{
                      width: `${(entry.total / spend) * 100}%`,
                      background:
                        CATEGORY_META[entry.category as keyof typeof CATEGORY_META]?.colorVar ??
                        "var(--muted)",
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function AmountField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 focus-within:border-primary">
        <span className="text-base text-muted">₺</span>
        <input
          type="number"
          min={0}
          step={100}
          value={value || ""}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          placeholder="0"
          className="money w-full bg-transparent text-lg font-semibold text-foreground outline-none"
        />
      </div>
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  );
}

function StatTile({ label, value, tint }: { label: string; value: string; tint: string }) {
  return (
    <div
      className="rounded-2xl border border-border p-4"
      style={{ background: `color-mix(in oklab, ${tint} 10%, var(--surface))` }}
    >
      <p className="text-sm text-muted">{label}</p>
      <p className="money mt-1 text-2xl font-semibold tracking-tight" style={{ color: tint }}>
        {value}
      </p>
    </div>
  );
}

/** Sütun etiketleri için kısaltılmış tutar: ₺3.507 gibi, kuruşsuz. */
function compactMoney(value: number, locale: string) {
  return "₺" + new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);
}

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** Son altı ayın toplamlarını, boş aylar dahil, kronolojik sırada verir. */
function lastSixMonths(receipts: SavedReceipt[], locale: string) {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat(locale, { month: "short" });

  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const total = receipts
      .filter((r) => r.date?.startsWith(key))
      .reduce((sum, r) => sum + (r.total || 0), 0);
    return { key, label: formatter.format(date), total };
  });
}

function byCategory(items: SavedReceipt[]) {
  const totals = new Map<string, number>();
  for (const item of items) {
    const category = item.category || "Diğer";
    totals.set(category, (totals.get(category) || 0) + (item.total || 0));
  }
  return Array.from(totals.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

function useHistory() {
  const [history, setHistory] = useState<History | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/history", { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;
        setHistory({
          receipts: Array.isArray(data.receipts) ? data.receipts : [],
          monthlyIncome: typeof data.monthlyIncome === "number" ? data.monthlyIncome : null,
          monthlyBudget: typeof data.monthlyBudget === "number" ? data.monthlyBudget : null,
        });
      } catch {
        setHistory({ receipts: [], monthlyIncome: null, monthlyBudget: null });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return history;
}
