import type { Metadata } from "next";
import { Geist, Geist_Mono, Sora } from "next/font/google";
import SettingsProvider from "@/components/SettingsProvider";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";
import { THEME_INIT_SCRIPT } from "@/lib/settings";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Başlıklar için ikinci karakter: modern, teknolojik bir grotesk.
const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: `${APP_NAME} — ${APP_TAGLINE}`,
  description: "Fişlerini yükle, yapay zekâ okusun, Google Sheets'e aktarsın.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${sora.variable} h-full antialiased`}
    >
      <head>
        {/* Tema özniteliklerini ilk boyamadan önce yazar; yanlış temanın bir an
            görünmesini engeller. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
        <SettingsProvider>{children}</SettingsProvider>
      </body>
    </html>
  );
}
