"use client";

import { useEffect, useMemo, useState } from "react";
import { useSettings } from "@/components/SettingsProvider";
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
  // Sheet'teki named range öncelikli; yoksa burada girilen değer kullanılır.
  const income = positive(history?.monthlyIncome) ?? positive(settings.monthlyIncome);
  const budget = positive(history?.monthlyBudget) ?? positive(settings.monthlyBudget);

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
  const categories = useMemo(() => byCategory(monthItems), [monthItems]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="sr-rise">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          {t("plan.title")}
        </h1>
        <p className="mt-1 text-base text-muted">{t("plan.subtitle")}</p>
      </div>

      <section className="sr-rise grid gap-3 rounded-2xl border border-border bg-surface p-5 shadow-sm sm:grid-cols-2">
        <AmountField
          label={t("plan.income")}
          value={settings.monthlyIncome}
          onChange={(value) => update({ monthlyIncome: value })}
          disabled={history?.monthlyIncome != null && history.monthlyIncome > 0}
        />
        <AmountField
          label={`${t("plan.budget")} (${t("plan.budgetOptional")})`}
          value={settings.monthlyBudget}
          onChange={(value) => update({ monthlyBudget: value })}
          disabled={history?.monthlyBudget != null && history.monthlyBudget > 0}
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

      <section className="sr-rise rounded-2xl border border-border bg-surface p-5 shadow-sm">
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

      <section className="sr-rise rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="font-display text-base font-semibold text-foreground">{t("plan.trend")}</h2>
        <div className="mt-5 flex h-40 items-end gap-2.5">
          {months.map((month) => {
            const peak = Math.max(...months.map((m) => m.total), 1);
            const isCurrent = month.key === monthKey;
            return (
              <div key={month.key} className="flex flex-1 flex-col items-center gap-2">
                <span className="money text-xs text-muted">
                  {month.total > 0 ? Math.round(month.total).toLocaleString(locale) : ""}
                </span>
                <div
                  className="w-full rounded-t-lg transition-[height] duration-700"
                  style={{
                    height: `${Math.max((month.total / peak) * 100, 2)}%`,
                    background: isCurrent ? "var(--primary)" : "var(--surface-muted)",
                    border: isCurrent ? "none" : "1px solid var(--border)",
                  }}
                  title={formatMoney(month.total, "TRY", locale)}
                />
                <span
                  className={`text-xs capitalize ${isCurrent ? "text-foreground" : "text-muted"}`}
                >
                  {month.label}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="sr-rise rounded-2xl border border-border bg-surface p-5 shadow-sm">
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
  disabled,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
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
          disabled={disabled}
          value={value || ""}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          placeholder="0"
          className="money w-full bg-transparent text-lg font-semibold text-foreground outline-none disabled:opacity-60"
        />
      </div>
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
