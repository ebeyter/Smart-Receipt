"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Star, TrendingUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSettings } from "@/components/SettingsProvider";
import { useT } from "@/lib/i18n";
import { MARKET_PRESETS } from "@/lib/settings";

/**
 * Piyasa takibi için dış uygulama seçtiren menü. Uygulama piyasa verisi çekmez;
 * ayarlardaki varsayılan site listenin başında yıldızla işaretlenir.
 */
export default function MarketMenu() {
  const { settings } = useSettings();
  const { t } = useT();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const items = [...MARKET_PRESETS].sort((a, b) => {
    const aDefault = a.url === settings.marketUrl ? 0 : 1;
    const bDefault = b.url === settings.marketUrl ? 0 : 1;
    return aDefault - bDefault;
  });

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-xl border border-border bg-surface/70 px-5 py-3 text-base font-medium text-foreground backdrop-blur transition-colors hover:bg-surface-muted"
      >
        <TrendingUp className="h-4.5 w-4.5 text-primary" />
        {t("market.button")}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className="absolute left-0 top-full z-30 mt-2 w-72 max-w-[calc(100vw-3rem)] overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl shadow-foreground/10"
          >
            <p className="border-b border-border px-4 py-2.5 text-sm text-muted">
              {t("market.prompt")}
            </p>
            <ul className="max-h-80 overflow-y-auto p-1.5">
              {items.map((item) => {
                const isDefault = item.url === settings.marketUrl;
                return (
                  <li key={item.url}>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      role="menuitem"
                      onClick={() => setIsOpen(false)}
                      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-muted"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5 text-base font-medium text-foreground">
                          {item.label}
                          {isDefault && <Star className="h-3.5 w-3.5 fill-primary text-primary" />}
                        </span>
                        <span className="block truncate text-sm text-muted">{t(item.noteKey)}</span>
                      </span>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-muted transition-colors group-hover:text-primary" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
