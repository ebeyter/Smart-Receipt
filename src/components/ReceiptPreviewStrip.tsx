"use client";

import { useT } from "@/lib/i18n";
import type { Receipt } from "@/lib/types";

type Props = {
  receipts: Receipt[];
  onRemove: (id: string) => void;
};

const STATUS_KEY = {
  pending: "preview.pending",
  analyzing: "preview.analyzing",
  ready: "preview.ready",
  error: "preview.error",
} as const;

export default function ReceiptPreviewStrip({ receipts, onRemove }: Props) {
  const { t } = useT();

  if (receipts.length === 0) return null;

  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {receipts.map((r) => (
        <div
          key={r.id}
          className="group relative w-28 shrink-0 overflow-hidden rounded-xl border border-border bg-surface"
        >
          <button
            type="button"
            onClick={() => onRemove(r.id)}
            aria-label={t("preview.remove")}
            className="absolute right-1 top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs leading-none text-white opacity-0 transition-opacity group-hover:opacity-100"
          >
            ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={r.imageDataUrl}
            alt={r.fileName}
            className="h-24 w-full object-cover"
          />
          <div
            className={`px-1.5 py-1 text-center text-xs font-medium ${
              r.status === "error"
                ? "bg-danger-soft text-danger"
                : r.status === "ready"
                  ? "bg-success-soft text-success"
                  : r.status === "analyzing"
                    ? "bg-primary-soft text-primary"
                    : "bg-surface-muted text-muted"
            }`}
          >
            {t(STATUS_KEY[r.status])}
            {r.part && ` · ${r.part.index}/${r.part.total}`}
          </div>
        </div>
      ))}
    </div>
  );
}
