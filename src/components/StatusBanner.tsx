"use client";

import { useT } from "@/lib/i18n";

type Props = {
  kind: "success" | "error" | "info";
  message: string;
  onDismiss?: () => void;
};

const STYLES: Record<Props["kind"], string> = {
  success: "bg-success-soft text-success border-success/20",
  error: "bg-danger-soft text-danger border-danger/20",
  info: "bg-primary-soft text-primary border-primary/20",
};

const ICON: Record<Props["kind"], string> = {
  success: "✓",
  error: "!",
  info: "ⓘ",
};

export default function StatusBanner({ kind, message, onDismiss }: Props) {
  const { t } = useT();

  return (
    <div
      role="status"
      className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-base ${STYLES[kind]}`}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-current/15 text-sm font-bold">
        {ICON[kind]}
      </span>
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={t("banner.dismiss")}
          className="shrink-0 text-current/70 hover:text-current"
        >
          ✕
        </button>
      )}
    </div>
  );
}
