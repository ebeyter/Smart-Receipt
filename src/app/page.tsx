"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import UploadPanel from "@/components/UploadPanel";
import ReceiptPreviewStrip from "@/components/ReceiptPreviewStrip";
import ResultsTable from "@/components/ResultsTable";
import SummaryPanel from "@/components/SummaryPanel";
import StatusBanner from "@/components/StatusBanner";
import { uid } from "@/lib/format";
import type { Receipt, SavedReceipt } from "@/lib/types";

const CONCURRENCY = 3;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Home() {
  const router = useRouter();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [banner, setBanner] = useState<{
    kind: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState<SavedReceipt[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    setIsHistoryLoading(true);
    try {
      const res = await fetch("/api/history");
      if (res.ok) {
        const data = await res.json();
        setHistory(Array.isArray(data.receipts) ? data.receipts : []);
      }
    } catch {
      // history is best-effort; the app still works without it
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  async function handleFilesSelected(files: File[]) {
    const newReceipts = await Promise.all(
      files.map(async (file) => {
        const imageDataUrl = await fileToDataUrl(file);
        const receipt: Receipt = {
          id: uid(),
          status: "pending",
          file,
          imageDataUrl,
          fileName: file.name,
          merchant: "",
          date: "",
          time: "",
          category: "",
          total: "",
          currency: "TRY",
          tax: "",
          bankName: "",
          items: [],
        };
        return receipt;
      })
    );
    setReceipts((prev) => [...prev, ...newReceipts]);
    setBanner(null);
  }

  function removeReceipt(id: string) {
    setReceipts((prev) => prev.filter((r) => r.id !== id));
  }

  function updateField(
    id: string,
    field: keyof Receipt,
    value: string
  ) {
    setReceipts((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  }

  function updateItems(id: string, items: string[]) {
    setReceipts((prev) =>
      prev.map((r) => (r.id === id ? { ...r, items } : r))
    );
  }

  async function analyzeOne(receipt: Receipt) {
    setReceipts((prev) =>
      prev.map((r) =>
        r.id === receipt.id ? { ...r, status: "analyzing" } : r
      )
    );
    try {
      const formData = new FormData();
      formData.append("image", receipt.file);
      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analiz başarısız.");

      const e = data.extracted;
      setReceipts((prev) =>
        prev.map((r) =>
          r.id === receipt.id
            ? {
                ...r,
                status: "ready",
                merchant: e.merchant ?? "",
                date: e.date ?? "",
                time: e.time ?? "",
                category: e.category ?? "",
                total: e.total != null ? String(e.total) : "",
                currency: e.currency ?? "TRY",
                tax: e.tax != null ? String(e.tax) : "",
                bankName: e.bankName ?? "",
                items: e.items ?? [],
              }
            : r
        )
      );
    } catch (err) {
      setReceipts((prev) =>
        prev.map((r) =>
          r.id === receipt.id
            ? {
                ...r,
                status: "error",
                error: err instanceof Error ? err.message : "Hata oluştu.",
              }
            : r
        )
      );
    }
  }

  async function handleAnalyze() {
    const pending = receipts.filter((r) => r.status === "pending");
    if (pending.length === 0) return;
    setIsAnalyzing(true);
    setBanner(null);

    let index = 0;
    async function worker() {
      while (index < pending.length) {
        const receipt = pending[index++];
        await analyzeOne(receipt);
      }
    }
    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, pending.length) }, worker)
    );

    setIsAnalyzing(false);
  }

  async function handleSubmit() {
    const ready = receipts.filter((r) => r.status === "ready");
    if (ready.length === 0) return;
    setIsSubmitting(true);
    setBanner(null);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        body: JSON.stringify({
          receipts: ready.map((r) => ({
            merchant: r.merchant,
            date: r.date,
            time: r.time,
            category: r.category,
            total: parseFloat(r.total) || 0,
            currency: r.currency,
            tax: r.tax,
            bankName: r.bankName,
            items: r.items,
            imageDataUrl: r.imageDataUrl,
            fileName: r.fileName,
          })),
        }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gönderim başarısız.");

      setReceipts((prev) => prev.filter((r) => r.status !== "ready"));
      setBanner({
        kind: "success",
        message: `${ready.length} fiş başarıyla Google Sheets'e gönderildi.`,
      });
      loadHistory();
    } catch (err) {
      setBanner({
        kind: "error",
        message:
          err instanceof Error ? err.message : "Gönderim sırasında hata oluştu.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  const pendingCount = receipts.filter((r) => r.status === "pending").length;
  const readyCount = receipts.filter((r) => r.status === "ready").length;
  const errorCount = receipts.filter((r) => r.status === "error").length;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-lg text-white">
          🧾
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Smart Receipt
          </h1>
          <p className="text-xs text-muted">
            Fişlerini tara, yapay zekâ okusun, Google Sheets&apos;e aktarsın.
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
        >
          Çıkış yap
        </button>
      </header>

      {banner && (
        <div className="mt-5">
          <StatusBanner
            kind={banner.kind}
            message={banner.message}
            onDismiss={() => setBanner(null)}
          />
        </div>
      )}

      {errorCount > 0 && (
        <div className="mt-3">
          <StatusBanner
            kind="error"
            message={`${errorCount} fiş analiz edilemedi. Önizlemeden kaldırıp tekrar deneyebilirsin.`}
          />
        </div>
      )}

      <main className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <UploadPanel
            onFilesSelected={handleFilesSelected}
            pendingCount={pendingCount}
            totalCount={receipts.length}
            isAnalyzing={isAnalyzing}
            onAnalyze={handleAnalyze}
          />

          {receipts.length > 0 && (
            <ReceiptPreviewStrip receipts={receipts} onRemove={removeReceipt} />
          )}

          <ResultsTable
            receipts={receipts}
            onChange={updateField}
            onItemsChange={updateItems}
            onRemove={removeReceipt}
          />

          {readyCount > 0 && (
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Gönderiliyor…
                  </>
                ) : (
                  `Google Sheets'e Gönder (${readyCount})`
                )}
              </button>
            </div>
          )}
        </div>

        <aside>
          <SummaryPanel items={history} isLoading={isHistoryLoading} />
        </aside>
      </main>
    </div>
  );
}
