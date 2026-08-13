"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { CATEGORY_META } from "@/lib/categories";
import { formatMoney } from "@/lib/format";
import { useT } from "@/lib/i18n";
import type { SavedReceipt } from "@/lib/types";

const OUTER_DOTS = 44;
const INNER_DOTS = 32;
const CENTER = 224;

type Props = {
  receipts: SavedReceipt[] | null;
  reduceMotion?: boolean;
};

/**
 * Ayın harcamasını iç içe iki nokta halkasıyla gösterir: her nokta toplamın bir
 * dilimi, rengi ise ait olduğu kategoridir. Veri yokken halka sönük durur.
 */
export default function MonthPulse({ receipts, reduceMotion }: Props) {
  const systemReduce = useReducedMotion();
  const { t, locale, category } = useT();
  const animate = !reduceMotion && !systemReduce;

  const summary = useMemo(() => summarize(receipts), [receipts]);
  const animatedTotal = useCountUp(summary.total, animate);
  const shownTotal = animate ? animatedTotal : summary.total;

  const dots = useMemo(
    () => [
      ...ring(OUTER_DOTS, 190, summary.shares),
      ...ring(INNER_DOTS, 156, summary.shares),
    ],
    [summary.shares]
  );

  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 24, scale: 0.96 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className="relative mx-auto w-full max-w-md"
    >
      <div
        aria-hidden
        className="absolute inset-6 -z-10 rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--primary), transparent 70%)" }}
      />

      <div className="relative aspect-square w-full">
        <svg viewBox="0 0 448 448" className="h-full w-full">
          {dots.map((dot, index) => (
            <motion.circle
              key={index}
              cx={dot.x}
              cy={dot.y}
              r={9}
              fill={dot.color}
              initial={animate ? { opacity: 0, scale: 0 } : false}
              animate={{ opacity: dot.active ? 0.95 : 0.18, scale: 1 }}
              transition={{ delay: animate ? 0.15 + index * 0.012 : 0, duration: 0.4 }}
              style={{ transformOrigin: `${dot.x}px ${dot.y}px` }}
            />
          ))}
        </svg>

        {/* Halkanın iç çapına sığsın diye genişlik %60 ile sınırlı. */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <div className="flex w-[60%] flex-col items-center text-center">
            <span className="text-xs font-medium uppercase tracking-[0.22em] text-muted">
              {t("pulse.thisMonth")}
            </span>
            <span className="money mt-2 w-full truncate text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {formatMoney(shownTotal, summary.currency, locale)}
            </span>
            <span className="mt-2 text-sm text-muted">
              {summary.count > 0
                ? t("pulse.receipts", { count: summary.count })
                : t("pulse.empty")}
            </span>
          </div>
        </div>
      </div>

      {summary.breakdown.length > 0 && (
        <ul className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
          {summary.breakdown.slice(0, 3).map((entry, index) => (
            <motion.li
              key={entry.category}
              initial={animate ? { opacity: 0, y: 8 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: animate ? 0.7 + index * 0.1 : 0 }}
              className="flex items-center gap-2 text-sm"
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: entry.color }} />
              <span className="font-medium text-foreground">{category(entry.category)}</span>
              <span className="money text-muted">
                {formatMoney(entry.total, summary.currency, locale)}
              </span>
            </motion.li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}

type Share = { color: string; count: number };

function summarize(receipts: SavedReceipt[] | null) {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthItems = (receipts ?? []).filter((r) => r.date?.startsWith(monthKey));
  const total = monthItems.reduce((sum, r) => sum + (r.total || 0), 0);

  const totals = new Map<string, number>();
  for (const item of monthItems) {
    const category = item.category || "Diğer";
    totals.set(category, (totals.get(category) || 0) + (item.total || 0));
  }

  const breakdown = Array.from(totals.entries())
    .map(([category, categoryTotal]) => ({
      category,
      total: categoryTotal,
      color:
        CATEGORY_META[category as keyof typeof CATEGORY_META]?.colorVar ?? "var(--muted)",
    }))
    .sort((a, b) => b.total - a.total);

  // Her kategori, toplam içindeki payı kadar nokta alır.
  const shares: Share[] = total
    ? breakdown.map((entry) => ({
        color: entry.color,
        count: Math.max(1, Math.round((entry.total / total) * (OUTER_DOTS + INNER_DOTS))),
      }))
    : [];

  return {
    total,
    count: monthItems.length,
    currency: monthItems[0]?.currency || "TRY",
    breakdown,
    shares,
  };
}

/** Halkadaki noktaları üretir ve kategori paylarına göre boyar. */
function ring(count: number, radius: number, shares: Share[]) {
  const totalActive = shares.reduce((sum, s) => sum + s.count, 0);

  return Array.from({ length: count }, (_, index) => {
    // Saat 12 yönünden başlayıp saat yönünde ilerlesin.
    const angle = (index / count) * 2 * Math.PI - Math.PI / 2;
    const ratio = totalActive ? index / count : 0;

    let color = "var(--muted)";
    let active = false;
    if (totalActive) {
      let cursor = 0;
      for (const share of shares) {
        cursor += share.count / totalActive;
        if (ratio < cursor) {
          color = share.color;
          active = true;
          break;
        }
      }
    }

    return {
      x: CENTER + radius * Math.cos(angle),
      y: CENTER + radius * Math.sin(angle),
      color,
      active,
    };
  });
}

function useCountUp(target: number, active: boolean) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    let frame = 0;
    const started = performance.now();
    const duration = 900;

    const tick = (now: number) => {
      const progress = Math.min((now - started) / duration, 1);
      setValue(target * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, active]);

  return value;
}
