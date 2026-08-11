"use client";

import { useRef, useState } from "react";

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
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-foreground">Fiş Yükle</h2>
      <p className="mt-1 text-xs text-muted">
        Bilgisayarından yükle ya da kamerayla çek. Aynı anda birden fazla fiş
        seçebilirsin.
      </p>

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
        <p className="mt-3 text-sm font-medium text-foreground">
          Fiş görsellerini sürükle bırak
        </p>
        <p className="mt-0.5 text-xs text-muted">ya da göz atmak için tıkla</p>
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
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-surface-muted"
        >
          Fotoğraf Yükle
        </button>
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-surface-muted"
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
          Kamerayla Çek
        </button>
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
        <p className="mt-3 text-xs text-muted">
          {totalCount} fiş yüklendi
          {pendingCount > 0 ? ` · ${pendingCount} analiz bekliyor` : ""}
        </p>
      )}

      <button
        type="button"
        disabled={pendingCount === 0 || isAnalyzing}
        onClick={onAnalyze}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isAnalyzing ? (
          <>
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Analiz ediliyor…
          </>
        ) : (
          <>Fişleri Analiz Et{pendingCount > 0 ? ` (${pendingCount})` : ""}</>
        )}
      </button>
    </section>
  );
}
