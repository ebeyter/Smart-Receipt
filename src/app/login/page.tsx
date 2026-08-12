"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Giriş başarısız.");
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Giriş başarısız.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center px-4 py-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-lg text-white">
        🧾
      </div>
      <h1 className="mt-3 text-lg font-semibold tracking-tight text-foreground">
        Smart Receipt
      </h1>
      <p className="mt-1 text-center text-xs text-muted">
        Devam etmek için şifreni gir.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 w-full rounded-2xl border border-border bg-surface p-5 shadow-sm"
      >
        <label className="text-xs font-medium text-muted" htmlFor="password">
          Şifre
        </label>
        <input
          id="password"
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
        />

        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting || password.length === 0}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Giriş yapılıyor…
            </>
          ) : (
            "Giriş Yap"
          )}
        </button>
      </form>
    </div>
  );
}
