"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Landing arka planı: çok soluk bir milimetrik kâğıt ızgarası, altında yükselen
 * bir çizgi grafik silueti ve iki yumuşak renk lekesi. Okunaklığı bozmamak için
 * hepsi düşük opaklıkta ve kenarlara doğru maskeyle söner.
 */
export default function FinanceBackdrop() {
  const reduceMotion = useReducedMotion();

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(to right, var(--border) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 90% 70% at 50% 25%, black 20%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 90% 70% at 50% 25%, black 20%, transparent 75%)",
        }}
      />

      <div
        className="absolute -top-56 left-1/4 h-[38rem] w-[38rem] rounded-full opacity-25 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--primary), transparent 65%)" }}
      />
      <div
        className="absolute -bottom-64 -right-24 h-[34rem] w-[34rem] rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--accent), transparent 65%)" }}
      />

      <svg
        viewBox="0 0 1200 300"
        preserveAspectRatio="none"
        className="absolute bottom-0 left-0 h-64 w-full"
      >
        <defs>
          <linearGradient id="sr-chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.16" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path
          d="M0 250 L120 232 L240 244 L360 196 L480 214 L600 158 L720 176 L840 120 L960 138 L1080 74 L1200 96 L1200 300 L0 300 Z"
          fill="url(#sr-chart-fill)"
        />
        <motion.path
          d="M0 250 L120 232 L240 244 L360 196 L480 214 L600 158 L720 176 L840 120 L960 138 L1080 74 L1200 96"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2"
          strokeOpacity="0.35"
          strokeLinejoin="round"
          strokeLinecap="round"
          initial={reduceMotion ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.8, ease: "easeOut" }}
        />
      </svg>
    </div>
  );
}
