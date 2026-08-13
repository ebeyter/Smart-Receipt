"use client";

import { motion } from "framer-motion";
import { ArrowRight, Camera, Sparkles, Table2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import AppMark from "@/components/AppMark";
import FinanceBackdrop from "@/components/FinanceBackdrop";
import FlowDemo from "@/components/FlowDemo";
import MarketMenu from "@/components/MarketMenu";
import MonthPulse from "@/components/MonthPulse";
import ThemeQuickToggle from "@/components/ThemeQuickToggle";
import { useSettings } from "@/components/SettingsProvider";
import { APP_NAME } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { useIsHydrated } from "@/lib/hooks";
import type { TKey } from "@/lib/i18n";
import type { SavedReceipt } from "@/lib/types";

/** Vaadin üç maddesi; renkleri aşağıdaki akış demosunun adımlarıyla eşleşir. */
const BULLETS = [
  { icon: Camera, tint: "var(--cat-1)", leadKey: "landing.bullet1.lead", textKey: "landing.bullet1.text" },
  { icon: Sparkles, tint: "var(--cat-2)", leadKey: "landing.bullet2.lead", textKey: "landing.bullet2.text" },
  { icon: Table2, tint: "var(--cat-3)", leadKey: "landing.bullet3.lead", textKey: "landing.bullet3.text" },
] as const;

/** Selamlamanın altındaki kısa cesaretlendirme; güne göre dönüşümlü. */
const MOTIVATION_KEYS = [
  "landing.motivation1",
  "landing.motivation2",
  "landing.motivation3",
  "landing.motivation4",
] as const;

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 0.68, 0.32, 1] as const },
  },
};

export default function LandingPage() {
  const { settings } = useSettings();
  const { t } = useT();
  const isHydrated = useIsHydrated();
  const receipts = useHistory();

  const greeting = buildGreeting(t, isHydrated, settings.displayName);
  const motivationKey = isHydrated
    ? MOTIVATION_KEYS[new Date().getDate() % MOTIVATION_KEYS.length]
    : MOTIVATION_KEYS[0];

  return (
    <main className="relative flex min-h-dvh flex-1 flex-col lg:h-dvh lg:overflow-hidden">
      <FinanceBackdrop />

      <div className="mx-auto flex w-full max-w-6xl shrink-0 items-center gap-3 px-6 py-4">
        <span className="flex items-center gap-2.5 font-display text-lg font-semibold tracking-tight text-foreground">
          <AppMark className="h-9 w-9 rounded-xl" />
          {APP_NAME}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <Link
            href="/ayarlar"
            className="rounded-lg px-3 py-2 text-base font-medium text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
          >
            Ayarlar
          </Link>
          <ThemeQuickToggle />
        </div>
      </div>

      <section className="mx-auto grid w-full max-w-6xl items-center gap-8 px-6 py-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[1.1fr_0.9fr]">
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center text-center lg:items-start lg:text-left"
        >
          <motion.span
            variants={item}
            className="rounded-full border border-border bg-surface/70 px-4 py-1.5 text-base font-medium text-muted backdrop-blur"
          >
            {greeting}
          </motion.span>

          <motion.h1
            variants={item}
            className="mt-6 bg-gradient-to-br from-primary via-foreground to-accent bg-clip-text font-display text-[clamp(2.5rem,6vw,3.75rem)] font-bold leading-[1.05] tracking-tight text-transparent"
          >
            {APP_NAME}
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-2 font-display text-[clamp(1.15rem,2.2vw,1.6rem)] font-semibold leading-snug text-foreground"
          >
            {t("app.tagline")}
          </motion.p>

          <motion.ul variants={item} className="mt-5 flex flex-col gap-2.5 text-left">
            {BULLETS.map((bullet) => (
              <li key={bullet.leadKey} className="flex items-center gap-3">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    background: `color-mix(in oklab, ${bullet.tint} 16%, transparent)`,
                    color: bullet.tint,
                  }}
                >
                  <bullet.icon className="h-4 w-4" />
                </span>
                <span className="text-base text-muted lg:text-lg">
                  <Highlight>{t(bullet.leadKey)}</Highlight> {t(bullet.textKey)}
                </span>
              </li>
            ))}
          </motion.ul>

          <motion.div
            variants={item}
            className="mt-6 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
          >
            <Button
              asChild
              size="lg"
              className="group font-display font-semibold shadow-xl shadow-primary/30 transition-transform hover:-translate-y-0.5"
            >
              <Link href="/panel">
                {t("landing.cta")}
                <ArrowRight
                  className="-me-1 ms-2 h-5 w-5 opacity-70 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </Button>

            <MarketMenu />
          </motion.div>

          <motion.p variants={item} className="mt-3 text-base font-medium text-primary">
            {t(motivationKey)}
          </motion.p>
        </motion.div>

        <div className="mx-auto w-full max-w-[300px] lg:max-w-[min(340px,36dvh)]">
          <MonthPulse receipts={receipts} reduceMotion={settings.reduceMotion} />
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl shrink-0 px-6 pb-6 pt-2">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <FlowDemo reduceMotion={settings.reduceMotion} />
        </motion.div>
      </section>
    </main>
  );
}

function Highlight({ children }: { children: React.ReactNode }) {
  return <strong className="font-semibold text-foreground">{children}</strong>;
}

/** Saate göre selamlama; hydration farkı olmaması için yalnızca tarayıcıda hesaplanır. */
function buildGreeting(
  t: (key: TKey) => string,
  isHydrated: boolean,
  displayName: string
) {
  const name = displayName.trim();
  const hour = isHydrated ? new Date().getHours() : -1;
  const base =
    hour < 0
      ? t("greet.welcome")
      : hour < 6
        ? t("greet.night")
        : hour < 12
          ? t("greet.morning")
          : hour < 18
            ? t("greet.day")
            : t("greet.evening");

  return name ? `${base}, ${name} 👋` : `${base} 👋`;
}

function useHistory() {
  const [receipts, setReceipts] = useState<SavedReceipt[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/history", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled) setReceipts(Array.isArray(data.receipts) ? data.receipts : []);
      } catch {
        // Geçmiş okunamazsa halka boş haliyle gösterilir.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return receipts;
}
