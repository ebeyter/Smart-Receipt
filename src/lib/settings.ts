export type Lang = "tr" | "en";
export type Theme = "system" | "light" | "dark";
export type Accent = "teal" | "indigo" | "amber" | "rose";
export type Currency = "TRY" | "USD" | "EUR";

export type Settings = {
  /** Karşılama mesajında kullanılır; boşsa selamlama isimsiz gösterilir. */
  displayName: string;
  /** Arayüz dili. Fiş verileri ve kategori adları bundan etkilenmez. */
  language: Lang;
  theme: Theme;
  accent: Accent;
  /** Yeni yüklenen fişlere önerilen para birimi. */
  defaultCurrency: Currency;
  /** Fiş seçilir seçilmez analizi otomatik başlat. */
  autoAnalyze: boolean;
  reduceMotion: boolean;
  /**
   * Piyasa takibi için kullanılan dış site. Uygulama piyasa verisi çekmez,
   * yalnızca bu adrese kısayol verir; boş bırakılırsa buton görünmez.
   */
  marketUrl: string;
  /** Üst çubuktaki kısayollar. Boşsa ilgili buton görünmez. */
  sheetUrl: string;
  driveUrl: string;
};

export const SETTINGS_KEY = "sr-settings";

export const DEFAULT_SETTINGS: Settings = {
  displayName: "",
  language: "tr",
  theme: "system",
  accent: "teal",
  defaultCurrency: "TRY",
  autoAnalyze: false,
  reduceMotion: false,
  marketUrl: "https://tr.investing.com/",
  sheetUrl: process.env.NEXT_PUBLIC_GOOGLE_SHEET_URL ?? "",
  driveUrl: process.env.NEXT_PUBLIC_GOOGLE_DRIVE_URL ?? "",
};

/** "Piyasalar" menüsünde listelenen dış siteler. Uygulama veri çekmez, sadece yönlendirir. */
export const MARKET_PRESETS = [
  { label: "Investing.com", url: "https://tr.investing.com/", noteKey: "market.note.investing" },
  { label: "TradingView", url: "https://tr.tradingview.com/", noteKey: "market.note.tradingview" },
  { label: "Doviz.com", url: "https://www.doviz.com/", noteKey: "market.note.doviz" },
  { label: "Bigpara", url: "https://bigpara.hurriyet.com.tr/", noteKey: "market.note.bigpara" },
  { label: "Bloomberg HT", url: "https://www.bloomberght.com/", noteKey: "market.note.bloomberght" },
  { label: "Google Finance", url: "https://www.google.com/finance/", noteKey: "market.note.googlefinance" },
  { label: "Yahoo Finance", url: "https://finance.yahoo.com/", noteKey: "market.note.yahoo" },
] as const;

/** Yalnızca http(s) adreslerine kısayol verilir (javascript: gibi şemalar engellenir). */
export function isSafeExternalUrl(url: string) {
  return /^https?:\/\/\S+$/i.test(url.trim());
}

export const THEMES = [
  { value: "system", labelKey: "settings.themeSystem", hintKey: "settings.themeSystemHint" },
  { value: "light", labelKey: "settings.themeLight", hintKey: "settings.themeLightHint" },
  { value: "dark", labelKey: "settings.themeDark", hintKey: "settings.themeDarkHint" },
] as const;

export const ACCENTS = [
  { value: "teal", labelKey: "settings.accentTeal", swatch: "#0f6e63" },
  { value: "indigo", labelKey: "settings.accentIndigo", swatch: "#4c4ddc" },
  { value: "amber", labelKey: "settings.accentAmber", swatch: "#b4690e" },
  { value: "rose", labelKey: "settings.accentRose", swatch: "#c04264" },
] as const;

export const CURRENCIES: { value: Currency; label: string }[] = [
  { value: "TRY", label: "₺ TRY" },
  { value: "USD", label: "$ USD" },
  { value: "EUR", label: "€ EUR" },
];

function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value);
}

/** localStorage'daki (elle bozulmuş olabilecek) kaydı varsayılanlarla harmanlar. */
export function normalizeSettings(raw: unknown): Settings {
  const data = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  return {
    displayName:
      typeof data.displayName === "string" ? data.displayName.slice(0, 40) : DEFAULT_SETTINGS.displayName,
    language: isOneOf(data.language, ["tr", "en"] as const) ? data.language : DEFAULT_SETTINGS.language,
    theme: isOneOf(data.theme, ["system", "light", "dark"] as const) ? data.theme : DEFAULT_SETTINGS.theme,
    accent: isOneOf(data.accent, ["teal", "indigo", "amber", "rose"] as const)
      ? data.accent
      : DEFAULT_SETTINGS.accent,
    defaultCurrency: isOneOf(data.defaultCurrency, ["TRY", "USD", "EUR"] as const)
      ? data.defaultCurrency
      : DEFAULT_SETTINGS.defaultCurrency,
    autoAnalyze: typeof data.autoAnalyze === "boolean" ? data.autoAnalyze : DEFAULT_SETTINGS.autoAnalyze,
    reduceMotion:
      typeof data.reduceMotion === "boolean" ? data.reduceMotion : DEFAULT_SETTINGS.reduceMotion,
    marketUrl:
      typeof data.marketUrl === "string" ? data.marketUrl.slice(0, 200) : DEFAULT_SETTINGS.marketUrl,
    sheetUrl:
      typeof data.sheetUrl === "string" ? data.sheetUrl.slice(0, 300) : DEFAULT_SETTINGS.sheetUrl,
    driveUrl:
      typeof data.driveUrl === "string" ? data.driveUrl.slice(0, 300) : DEFAULT_SETTINGS.driveUrl,
  };
}

export function readSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    return normalizeSettings(JSON.parse(window.localStorage.getItem(SETTINGS_KEY) || "{}"));
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function writeSettings(settings: Settings) {
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Gizli sekmede localStorage kapalı olabilir; ayarlar o oturumluk yaşar.
  }
}

/**
 * Görsel ayarları <html> özniteliklerine yazar. globals.css bu üç özniteliğe
 * bakarak renk şemasını ve hareketi belirler.
 */
export function applySettings(settings: Settings) {
  const root = document.documentElement;
  root.lang = settings.language;
  if (settings.theme === "system") root.removeAttribute("data-theme");
  else root.dataset.theme = settings.theme;

  if (settings.accent === "teal") root.removeAttribute("data-accent");
  else root.dataset.accent = settings.accent;

  if (settings.reduceMotion) root.dataset.motion = "reduced";
  else root.removeAttribute("data-motion");
}

/**
 * İlk boyamadan önce <head> içinde çalışır: React devreye girene kadar geçen
 * sürede yanlış temanın görünmesini (flash) engeller. applySettings ile aynı
 * işi yapar — biri değişirse diğeri de güncellenmeli.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(
  SETTINGS_KEY
)})||"{}");var d=document.documentElement;if(s.language==="en"||s.language==="tr")d.lang=s.language;if(s.theme==="dark"||s.theme==="light")d.dataset.theme=s.theme;if(s.accent&&s.accent!=="teal")d.dataset.accent=s.accent;if(s.reduceMotion)d.dataset.motion="reduced";}catch(e){}})();`;
