"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";

const TICK_MS = 750;
const TICK_COUNT = 9;

/** 2. adımda sırayla dolan alanlar. */
const FIELDS = [
  { key: "flow.merchant", value: "Migros" },
  { key: "flow.date", value: "12.08.2026" },
  { key: "flow.total", value: "₺842,50", money: true },
  { key: "flow.category", valueKey: "cat.Market" },
] as const;

const STEPS = [
  { no: "01", title: "Yükle ya da çek", tint: "var(--cat-1)" },
  { no: "02", title: "Yapay zekâ okusun", tint: "var(--cat-2)" },
  { no: "03", title: "Sheets'e yazsın", tint: "var(--cat-3)" },
];

/**
 * Ürünün akışını anlatmak yerine gösteren mini demo: fiş fotoğrafı taranır,
 * alanlar tek tek dolar, satır Sheet'e düşer. Döngü hâlinde tekrar eder.
 */
export default function FlowDemo({ reduceMotion }: { reduceMotion?: boolean }) {
  const systemReduce = useReducedMotion();
  const { t } = useT();
  const isStatic = Boolean(reduceMotion) || Boolean(systemReduce);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (isStatic) return;
    const id = setInterval(() => setTick((current) => (current + 1) % TICK_COUNT), TICK_MS);
    return () => clearInterval(id);
  }, [isStatic]);

  // Duraklar: 0-1 tarama, 2-5 alanlar, 6+ Sheet satırı.
  const phase = isStatic ? TICK_COUNT - 1 : tick;
  const isScanning = phase === 1;
  const visibleFields = Math.max(0, Math.min(FIELDS.length, phase - 1));
  const isWritten = phase >= 6;

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_auto_1.15fr_auto_1.15fr] lg:items-stretch">
      <FlowCard step={STEPS[0]}>
        <ReceiptPhoto isScanning={isScanning} />
      </FlowCard>

      <Connector active={visibleFields > 0} />

      <FlowCard step={STEPS[1]}>
        <ul className="flex flex-col gap-1.5">
          {FIELDS.map((field, index) => {
            const isVisible = index < visibleFields;
            return (
              <li
                key={field.key}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/60 px-3 py-1.5"
              >
                <span className="text-sm text-muted">{t(field.key)}</span>
                <AnimatePresence mode="wait">
                  {isVisible ? (
                    <motion.span
                      key="value"
                      initial={isStatic ? false : { opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex items-center gap-1.5 text-base font-medium text-foreground ${
                        "money" in field ? "money" : ""
                      }`}
                    >
                      {"value" in field ? field.value : t(field.valueKey)}
                      <Check className="h-3.5 w-3.5 text-success" />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="placeholder"
                      initial={false}
                      exit={{ opacity: 0 }}
                      className="h-3.5 w-20 rounded-full bg-surface-muted"
                    />
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </FlowCard>

      <Connector active={isWritten} />

      <FlowCard step={STEPS[2]}>
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="grid grid-cols-[1.2fr_1fr_0.9fr] bg-surface-muted text-sm font-medium text-muted">
            <span className="px-3 py-2">Merchant</span>
            <span className="px-3 py-2">Total</span>
            <span className="px-3 py-2">Category</span>
          </div>
          <div className="grid grid-cols-[1.2fr_1fr_0.9fr] border-t border-border text-sm text-muted">
            <span className="px-3 py-2">Şok</span>
            <span className="money px-3 py-2">₺214,00</span>
            <span className="px-3 py-2">Market</span>
          </div>
          <AnimatePresence>
            {isWritten && (
              <motion.div
                initial={isStatic ? false : { opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-[1.2fr_1fr_0.9fr] border-t border-border bg-success-soft text-base font-medium text-foreground"
              >
                <span className="px-3 py-2">Migros</span>
                <span className="money px-3 py-2">₺842,50</span>
                <span className="px-3 py-2">Market</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-2.5 flex items-center gap-2 text-sm">
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-full transition-colors ${
              isWritten ? "bg-success text-white" : "bg-surface-muted text-muted"
            }`}
          >
            <Check className="h-3 w-3" />
          </span>
          <span className={isWritten ? "text-success" : "text-muted"}>
            {isWritten ? t("flow.written") : t("flow.pending")}
          </span>
        </div>
      </FlowCard>
    </div>
  );
}

function FlowCard({
  step,
  children,
}: {
  step: (typeof STEPS)[number];
  children: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-surface/80 p-4 backdrop-blur">
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: step.tint }}
      />
      <div>{children}</div>
    </div>
  );
}

function Connector({ active }: { active: boolean }) {
  return (
    <div className="flex items-center justify-center lg:w-8">
      <ChevronRight
        className={`h-6 w-6 rotate-90 transition-colors duration-500 lg:rotate-0 ${
          active ? "text-primary" : "text-border"
        }`}
      />
    </div>
  );
}

/** Fiş fotoğrafı taklidi + üstünden geçen tarama ışığı. */
function ReceiptPhoto({ isScanning }: { isScanning: boolean }) {
  return (
    <div className="relative mx-auto w-32 rotate-[-3deg] overflow-hidden rounded-xl border border-border bg-background p-3 shadow-lg">
      <div className="flex flex-col gap-1.5">
        <span className="h-2 w-16 rounded-full bg-foreground/70" />
        <span className="h-1.5 w-24 rounded-full bg-muted/40" />
        <span className="mt-2 h-1.5 w-full rounded-full bg-muted/25" />
        <span className="h-1.5 w-4/5 rounded-full bg-muted/25" />
        <span className="h-1.5 w-full rounded-full bg-muted/25" />
        <span className="h-1.5 w-3/5 rounded-full bg-muted/25" />
        <div className="mt-2 flex items-center justify-between border-t border-dashed border-border pt-2">
          <span className="h-1.5 w-8 rounded-full bg-muted/40" />
          <span className="money text-sm font-semibold text-foreground">₺842,50</span>
        </div>
      </div>

      <AnimatePresence>
        {isScanning && (
          <motion.span
            initial={{ top: "0%", opacity: 0 }}
            animate={{ top: ["0%", "100%"], opacity: [0, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.75, ease: "linear" }}
            className="absolute inset-x-0 h-8"
            style={{
              background:
                "linear-gradient(to bottom, transparent, color-mix(in oklab, var(--primary) 35%, transparent), transparent)",
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
