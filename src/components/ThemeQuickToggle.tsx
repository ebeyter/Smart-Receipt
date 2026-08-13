"use client";

import { useSettings } from "@/components/SettingsProvider";
import { useMediaQuery } from "@/lib/hooks";
import { useT } from "@/lib/i18n";

/** Açık/koyu arasında tek tıkla geçiş; "Sistem" seçiliyken o anki görünümün tersine geçer. */
export default function ThemeQuickToggle({ className = "" }: { className?: string }) {
  const { settings, update } = useSettings();
  const systemPrefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const { t } = useT();

  const isDark =
    settings.theme === "dark" || (settings.theme === "system" && systemPrefersDark);
  const label = isDark ? t("theme.toLight") : t("theme.toDark");

  return (
    <button
      type="button"
      onClick={() => update({ theme: isDark ? "light" : "dark" })}
      aria-label={label}
      title={label}
      className={`flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-foreground ${className}`}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-5 w-5">
      <circle cx="12" cy="12" r="4" />
      <path
        strokeLinecap="round"
        d="M12 3v1.8M12 19.2V21M3 12h1.8M19.2 12H21M5.6 5.6l1.3 1.3M17.1 17.1l1.3 1.3M18.4 5.6l-1.3 1.3M6.9 17.1l-1.3 1.3"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className="h-5 w-5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 13.4A8.2 8.2 0 1 1 10.6 4a6.6 6.6 0 0 0 9.4 9.4Z"
      />
    </svg>
  );
}
