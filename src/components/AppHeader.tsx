"use client";

import { FolderOpen, Table2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AppMark from "@/components/AppMark";
import ThemeQuickToggle from "@/components/ThemeQuickToggle";
import { APP_NAME } from "@/lib/brand";
import { useSettings } from "@/components/SettingsProvider";
import { useT } from "@/lib/i18n";
import { isSafeExternalUrl } from "@/lib/settings";

const NAV = [
  { href: "/panel", labelKey: "nav.panel" },
  { href: "/ayarlar", labelKey: "nav.settings" },
] as const;

export default function AppHeader() {
  const pathname = usePathname();
  const { t } = useT();
  const { settings } = useSettings();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <AppMark className="h-9 w-9 rounded-xl" />
          <span className="text-lg font-semibold tracking-tight text-foreground">
            {APP_NAME}
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-1.5">
          {isSafeExternalUrl(settings.sheetUrl) && (
            <ExternalShortcut href={settings.sheetUrl} label={t("link.sheet")}>
              <Table2 className="h-4 w-4 text-cat-6" />
            </ExternalShortcut>
          )}
          {isSafeExternalUrl(settings.driveUrl) && (
            <ExternalShortcut href={settings.driveUrl} label={t("link.drive")}>
              <FolderOpen className="h-4 w-4 text-cat-4" />
            </ExternalShortcut>
          )}
        </div>

        <nav className="ml-3 flex items-center gap-1">
          {NAV.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary-soft text-primary"
                    : "text-muted hover:bg-surface-muted hover:text-foreground"
                }`}
              >
                {t(item.labelKey)}
              </Link>
            );
          })}
          <ThemeQuickToggle className="ml-1" />
        </nav>
      </div>
    </header>
  );
}

/** Google Sheets / Drive gibi dış hedeflere açılan küçük kısayol butonu. */
function ExternalShortcut({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      title={label}
      className="flex items-center gap-1.5 rounded-lg border border-border bg-surface/70 px-2.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </a>
  );
}
