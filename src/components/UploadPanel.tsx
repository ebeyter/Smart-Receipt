"use client";

import { useRef, useState } from "react";
import { CardStripe } from "@/components/ui/card-stripe";
import { useT } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

type Props = {
  onFilesSelected: (files: File[]) => void;
  pendingCount: number;
  totalCount: number;
  isAnalyzing: boolean;
  onAnalyze: () => void;
};

export default function UploadPanel({
  onFilesSelected,
  pendingCount,
  totalCount,
  isAnalyzing,
  onAnalyze,
}: Props) {
  const { t } = useT();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).filter((f) =>
      f.type.startsWith("image/")
    );
    if (files.length > 0) onFilesSelected(files);
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-surface/85 p-5 pl-6 shadow-sm backdrop-blur">
      <CardStripe tint="var(--cat-1)" />
      <h2 className="text-base font-semibold text-foreground">{t("upload.title")}</h2>
      <p className="mt-1 text-sm text-muted">{t("upload.desc")}</p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
          isDragging
            ? "border-primary bg-primary-soft"
            : "border-border bg-surface-muted hover:border-primary/60"
        }`}
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-primary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 16.5V4m0 0L7 9m5-5l5 5M5 20h14"
            />
          </svg>
        </div>
        <p className="mt-3 text-base font-medium text-foreground">{t("upload.drop")}</p>
        <p className="mt-0.5 text-sm text-muted">{t("upload.browse")}</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
          {t("upload.fromFile")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => cameraInputRef.current?.click()}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            className="h-4 w-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 8a2 2 0 0 1 2-2h1.5l1-1.5h7l1 1.5H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z"
            />
            <circle cx="12" cy="13" r="3.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t("upload.camera")}
        </Button>
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {totalCount > 0 && (
        <p className="mt-3 text-sm text-muted">
          {t("upload.loaded", { count: totalCount })}
          {pendingCount > 0 ? t("upload.waiting", { count: pendingCount }) : ""}
        </p>
      )}

      <Button
        disabled={pendingCount === 0 || isAnalyzing}
        onClick={onAnalyze}
        className="mt-4 w-full gap-2 font-semibold"
      >
        {isAnalyzing ? (
          <>
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-on-primary/40 border-t-on-primary" />
            {t("upload.analyzing")}
          </>
        ) : (
          <>
            {t("upload.analyze")}
            {pendingCount > 0 ? ` (${pendingCount})` : ""}
          </>
        )}
      </Button>
    </section>
  );
}
