"use client";

import { useCallback, useEffect, useState } from "react";
import UploadPanel from "@/components/UploadPanel";
import ReceiptPreviewStrip from "@/components/ReceiptPreviewStrip";
import ResultsTable from "@/components/ResultsTable";
import SummaryPanel from "@/components/SummaryPanel";
import StatusBanner from "@/components/StatusBanner";
import { useSettings } from "@/components/SettingsProvider";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
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

export default function PanelPage() {
  const { settings } = useSettings();
  const { t } = useT();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [banner, setBanner] = useState<{
    kind: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState<SavedReceipt[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [monthlyBudget, setMonthlyBudget] = useState<number | null>(null);
  const [monthlyIncome, setMonthlyIncome] = useState<number | null>(null);

  const loadHistory = useCallback(async () => {
    setIsHistoryLoading(true);
    try {
      const res = await fetch("/api/history");
      if (res.ok) {
        const data = await res.json();
        setHistory(Array.isArray(data.receipts) ? data.receipts : []);
        setMonthlyBudget(typeof data.monthlyBudget === "number" ? data.monthlyBudget : null);
        setMonthlyIncome(typeof data.monthlyIncome === "number" ? data.monthlyIncome : null);
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
          currency: settings.defaultCurrency,
          tax: "",
          bankName: "",
          items: [],
        };
        return receipt;
      })
    );
    setReceipts((prev) => [...prev, ...newReceipts]);
    setBanner(null);

    if (settings.autoAnalyze) await runAnalysis(newReceipts);
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
      if (!res.ok) throw new Error(data.error || t("panel.analyzeFailed"));

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
                currency: e.currency ?? settings.defaultCurrency,
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
                error: err instanceof Error ? err.message : t("panel.genericError"),
              }
            : r
        )
      );
    }
  }

  /** Verilen fişleri en fazla CONCURRENCY tanesi aynı anda olacak şekilde analiz eder. */
  async function runAnalysis(queue: Receipt[]) {
    if (queue.length === 0) return;
    setIsAnalyzing(true);
    setBanner(null);

    let index = 0;
    async function worker() {
      while (index < queue.length) {
        const receipt = queue[index++];
        await analyzeOne(receipt);
      }
    }
    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker)
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
      if (!res.ok) throw new Error(data.error || t("panel.submitFailed"));

      setReceipts((prev) => prev.filter((r) => r.status !== "ready"));
      setBanner({
        kind: "success",
        message: t("panel.success", { count: ready.length }),
      });
      loadHistory();
    } catch (err) {
      setBanner({
        kind: "error",
        message:
          err instanceof Error ? err.message : t("panel.submitError"),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const pendingCount = receipts.filter((r) => r.status === "pending").length;
  const readyCount = receipts.filter((r) => r.status === "ready").length;
  const errorCount = receipts.filter((r) => r.status === "error").length;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
      <div className="sr-rise">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          {t("panel.title")}
        </h1>
        <p className="mt-1 text-base text-muted">{t("panel.subtitle")}</p>
      </div>

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
            message={t("panel.analyzeErrors", { count: errorCount })}
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
            onAnalyze={() => runAnalysis(receipts.filter((r) => r.status === "pending"))}
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
              <Button disabled={isSubmitting} onClick={handleSubmit} className="gap-2">
                {isSubmitting ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-on-primary/40 border-t-on-primary" />
                    {t("panel.submitting")}
                  </>
                ) : (
                  t("panel.submit", { count: readyCount })
                )}
              </Button>
            </div>
          )}
        </div>

        <aside>
          <SummaryPanel
            items={history}
            isLoading={isHistoryLoading}
            monthlyBudget={monthlyBudget}
            monthlyIncome={monthlyIncome}
          />
        </aside>
      </main>
    </div>
  );
}
