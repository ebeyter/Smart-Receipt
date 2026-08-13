"use client";

import { useState } from "react";
import { useSettings } from "@/components/SettingsProvider";
import { Button } from "@/components/ui/button";
import { APP_NAME, APP_VERSION, PROJECT_REF } from "@/lib/brand";
import { LANGUAGES, useT } from "@/lib/i18n";
import { ACCENTS, CURRENCIES, isSafeExternalUrl, MARKET_PRESETS, THEMES } from "@/lib/settings";
import type { SavedReceipt } from "@/lib/types";

export default function SettingsPage() {
  const { settings, update, reset } = useSettings();
  const { t } = useT();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="sr-rise">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          {t("settings.title")}
        </h1>
        <p className="mt-1 text-base text-muted">{t("settings.subtitle")}</p>
      </div>

      <Section title={t("settings.profile")} description={t("settings.profileDesc")}>
        <Row label={t("settings.displayName")} hint={t("settings.displayNameHint")}>
          <input
            type="text"
            value={settings.displayName}
            onChange={(e) => update({ displayName: e.target.value.slice(0, 40) })}
            placeholder={t("settings.namePlaceholder")}
            className="w-40 rounded-lg border border-border bg-surface px-3 py-1.5 text-base text-foreground outline-none transition-colors focus:border-primary"
          />
        </Row>

        <Row label={t("settings.language")} hint={t("settings.languageDesc")}>
          <div className="flex gap-2">
            {LANGUAGES.map((language) => {
              const isActive = settings.language === language.value;
              return (
                <Button
                  key={language.value}
                  type="button"
                  size="sm"
                  variant={isActive ? "default" : "outline"}
                  aria-pressed={isActive}
                  onClick={() => update({ language: language.value })}
                >
                  {language.label}
                </Button>
              );
            })}
          </div>
        </Row>
      </Section>

      <Section title={t("settings.appearance")} description={t("settings.appearanceDesc")}>
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-medium text-foreground">{t("settings.theme")}</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {THEMES.map((theme) => {
                const isActive = settings.theme === theme.value;
                return (
                  <button
                    key={theme.value}
                    type="button"
                    onClick={() => update({ theme: theme.value })}
                    aria-pressed={isActive}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      isActive
                        ? "border-primary bg-primary-soft"
                        : "border-border bg-surface hover:border-primary/50"
                    }`}
                  >
                    <ThemePreview value={theme.value} />
                    <p
                      className={`mt-2 text-sm font-medium ${
                        isActive ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {t(theme.labelKey)}
                    </p>
                    <p className="text-xs leading-tight text-muted">{t(theme.hintKey)}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-foreground">{t("settings.accent")}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {ACCENTS.map((accent) => {
                const isActive = settings.accent === accent.value;
                return (
                  <button
                    key={accent.value}
                    type="button"
                    onClick={() => update({ accent: accent.value })}
                    aria-pressed={isActive}
                    className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "border-primary text-primary"
                        : "border-border text-muted hover:text-foreground"
                    }`}
                  >
                    <span
                      className="h-3.5 w-3.5 rounded-full"
                      style={{ background: accent.swatch }}
                    />
                    {t(accent.labelKey)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Section>

      <Section title={t("settings.prefs")} description={t("settings.prefsDesc")}>
        <Row label={t("settings.currency")} hint={t("settings.currencyHint")}>
          <select
            value={settings.defaultCurrency}
            onChange={(e) =>
              update({ defaultCurrency: e.target.value as typeof settings.defaultCurrency })
            }
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-base text-foreground outline-none transition-colors focus:border-primary"
          >
            {CURRENCIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Row>

        <Row label={t("settings.autoAnalyze")} hint={t("settings.autoAnalyzeHint")}>
          <Toggle
            checked={settings.autoAnalyze}
            onChange={(v) => update({ autoAnalyze: v })}
            label={t("settings.autoAnalyze")}
          />
        </Row>

        <Row label={t("settings.reduceMotion")} hint={t("settings.reduceMotionHint")}>
          <Toggle
            checked={settings.reduceMotion}
            onChange={(v) => update({ reduceMotion: v })}
            label={t("settings.reduceMotion")}
          />
        </Row>
      </Section>

      <MarketSection />

      <ConnectionSection />

      <DataSection />

      <Section title={t("settings.about")}>
        <div className="flex flex-col gap-1 text-sm text-muted">
          <p>
            <span className="font-display font-semibold text-foreground">{APP_NAME}</span> v
            {APP_VERSION}
          </p>
          <p>Next.js · fal.ai (Claude Sonnet 5 vision) · Google Apps Script · Sheets + Drive</p>
          <p>{PROJECT_REF}</p>
          <Button
            type="button"
            variant="danger"
            size="sm"
            className="mt-2 self-start"
            onClick={() => {
              if (confirm(t("settings.resetConfirm"))) reset();
            }}
          >
            {t("settings.reset")}
          </Button>
        </div>
      </Section>
    </div>
  );
}

/** "Piyasalar" menüsünde yıldızla işaretlenecek varsayılan siteyi seçtirir. */
function MarketSection() {
  const { settings, update } = useSettings();
  const { t } = useT();

  return (
    <Section title={t("settings.market")} description={t("settings.marketDesc")}>
      <div className="flex flex-wrap gap-2">
        {MARKET_PRESETS.map((preset) => {
          const isActive = settings.marketUrl === preset.url;
          return (
            <button
              key={preset.url}
              type="button"
              onClick={() => update({ marketUrl: preset.url })}
              aria-pressed={isActive}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-border text-muted hover:text-foreground"
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </Section>
  );
}

/** Apps Script bağlantısının gerçekten çalışıp çalışmadığını /api/history üzerinden dener. */
function ConnectionSection() {
  const { t } = useT();
  const { settings, update } = useSettings();
  const [state, setState] = useState<
    { kind: "idle" } | { kind: "testing" } | { kind: "ok"; count: number } | { kind: "fail" }
  >({ kind: "idle" });

  async function testConnection() {
    setState({ kind: "testing" });
    try {
      const res = await fetch("/api/history", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !Array.isArray(data.receipts)) throw new Error();
      setState({ kind: "ok", count: data.receipts.length });
    } catch {
      setState({ kind: "fail" });
    }
  }

  return (
    <Section title={t("settings.connection")} description={t("settings.connectionDesc")}>
      <Row label={t("settings.sheetUrl")} hint={t("settings.sheetUrlHint")}>
        <input
          type="url"
          value={settings.sheetUrl}
          onChange={(e) => update({ sheetUrl: e.target.value.slice(0, 300) })}
          placeholder="https://docs.google.com/spreadsheets/…"
          className="w-52 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground outline-none transition-colors focus:border-primary"
        />
      </Row>

      <Row label={t("settings.driveUrl")} hint={t("settings.driveUrlHint")}>
        <input
          type="url"
          value={settings.driveUrl}
          onChange={(e) => update({ driveUrl: e.target.value.slice(0, 300) })}
          placeholder="https://drive.google.com/drive/folders/…"
          className="w-52 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground outline-none transition-colors focus:border-primary"
        />
      </Row>

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <Button type="button" size="sm" onClick={testConnection} disabled={state.kind === "testing"}>
          {state.kind === "testing" ? t("settings.testing") : t("settings.testConnection")}
        </Button>

        {isSafeExternalUrl(settings.sheetUrl) && (
          <Button asChild variant="outline" size="sm">
            <a href={settings.sheetUrl} target="_blank" rel="noreferrer">
              {t("settings.openSheet")}
            </a>
          </Button>
        )}
      </div>

      {state.kind === "ok" && (
        <p className="mt-2 text-sm text-success">
          {t("settings.connectionOk", { count: state.count })}
        </p>
      )}
      {state.kind === "fail" && (
        <p className="mt-2 text-sm text-danger">{t("settings.connectionFail")}</p>
      )}
    </Section>
  );
}

function DataSection() {
  const { t } = useT();
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function exportCsv() {
    setIsExporting(true);
    setError(null);
    try {
      const res = await fetch("/api/history", { cache: "no-store" });
      const data = await res.json();
      const receipts: SavedReceipt[] = Array.isArray(data.receipts) ? data.receipts : [];
      if (receipts.length === 0) {
        setError(t("settings.exportEmpty"));
        return;
      }
      downloadCsv(receipts);
    } catch {
      setError(t("settings.exportFailed"));
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Section title={t("settings.data")} description={t("settings.dataDesc")}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        onClick={exportCsv}
        disabled={isExporting}
      >
        {isExporting ? t("settings.exporting") : t("settings.exportCsv")}
      </Button>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </Section>
  );
}

function downloadCsv(receipts: SavedReceipt[]) {
  // Sütun başlıkları Sheet ile birebir aynı kalsın diye çevrilmiyor.
  const headers = [
    "Merchant",
    "Date",
    "Time",
    "Category",
    "Total",
    "Currency",
    "Tax / VAT",
    "Bank Name",
    "Items",
    "Receipt Image URL",
    "Uploaded At",
  ];
  const rows = receipts.map((r) => [
    r.merchant,
    r.date,
    r.time,
    r.category,
    r.total,
    r.currency,
    r.tax,
    r.bankName,
    (r.items || []).join(", "),
    r.receiptImageUrl,
    r.uploadedAt,
  ]);
  const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n");

  // Excel'in Türkçe karakterleri doğru okuması için BOM ile başlatılıyor.
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `cepdefter-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="sr-rise rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <h2 className="font-display text-base font-semibold text-foreground">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      <div className="mt-4 flex flex-col gap-3">{children}</div>
    </section>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-border pt-3 first:border-0 first:pt-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {hint && <p className="text-xs leading-tight text-muted">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors ${
        checked ? "bg-primary" : "border border-border bg-surface-muted"
      }`}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full shadow-sm transition-[left] ${
          checked ? "left-6" : "left-1"
        }`}
        style={{ background: checked ? "var(--on-primary)" : "var(--surface)" }}
      />
    </button>
  );
}

/** Tema seçeneklerinin minik önizlemesi — seçmeden önce nasıl göründüğünü gösterir. */
function ThemePreview({ value }: { value: "system" | "light" | "dark" }) {
  const light = { bg: "#faf8f3", fg: "#1f2937", line: "#e8e1d3" };
  const dark = { bg: "#1a1815", fg: "#f0ece2", line: "#3a352d" };

  if (value === "system") {
    return (
      <span className="flex h-9 w-full overflow-hidden rounded-md border border-border">
        <PreviewHalf palette={light} />
        <PreviewHalf palette={dark} />
      </span>
    );
  }

  return (
    <span className="flex h-9 w-full overflow-hidden rounded-md border border-border">
      <PreviewHalf palette={value === "light" ? light : dark} full />
    </span>
  );
}

function PreviewHalf({
  palette,
  full,
}: {
  palette: { bg: string; fg: string; line: string };
  full?: boolean;
}) {
  return (
    <span
      className={`flex flex-col justify-center gap-1 p-1.5 ${full ? "w-full" : "w-1/2"}`}
      style={{ background: palette.bg }}
    >
      <span className="h-1 w-3/4 rounded-full" style={{ background: palette.fg, opacity: 0.75 }} />
      <span className="h-1 w-1/2 rounded-full" style={{ background: palette.line }} />
    </span>
  );
}
