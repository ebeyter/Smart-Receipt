"use client";

import { FolderOpen, Table2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AppMark from "@/components/AppMark";
import ThemeQuickToggle from "@/components/ThemeQuickToggle";
import { APP_NAME } from "@/lib/brand";
import { useSettings } from "@/components/SettingsProvider";
import { FlowButton } from "@/components/ui/flow-button";
import { useT } from "@/lib/i18n";
import { isSafeExternalUrl } from "@/lib/settings";

const NAV = [
  { href: "/panel", labelKey: "nav.panel" },
  { href: "/plan", labelKey: "nav.plan" },
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
            <FlowButton
              external
              size="sm"
              href={settings.sheetUrl}
              text={t("link.sheet")}
              icon={<Table2 className="h-4 w-4 text-cat-6 group-hover:text-background" />}
            />
          )}
          {isSafeExternalUrl(settings.driveUrl) && (
            <FlowButton
              external
              size="sm"
              href={settings.driveUrl}
              text={t("link.drive")}
              icon={<FolderOpen className="h-4 w-4 text-cat-4 group-hover:text-background" />}
            />
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
                className={`rounded-lg px-3.5 py-2 text-base font-medium transition-colors ${
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
