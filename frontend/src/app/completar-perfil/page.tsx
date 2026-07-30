"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { api, ApiError } from "@/lib/api";
import { safeReturnUrl, useAuth, useAuthRedirect } from "@/lib/auth";
import { formatBrazilianPhoneInput, isValidBrazilianPhone } from "@/lib/phone";

const inputClass =
  "w-full rounded-xl border border-fog bg-white px-4 py-3 text-sm outline-none transition-soft focus:border-brand focus:ring-2 focus:ring-brand/20";

function CompletarPerfilInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, refreshUser } = useAuth();
  const { ready } = useAuthRedirect();
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!ready || !token) return null;

  const returnUrl = safeReturnUrl(searchParams.get("returnUrl"));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValidBrazilianPhone(phone)) {
      setError("Informe um WhatsApp válido, com DDD.");
      return;
    }

    setSubmitting(true);
    try {
      await api.updateMe(token, { phone });
      await refreshUser();
      router.push(returnUrl);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Erro ao salvar seu WhatsApp.",
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="hero-glow flex min-h-full flex-1 flex-col items-center justify-center px-4 py-10">
      <div className="mb-8 flex animate-fade-up flex-col items-center gap-3">
        <BrandLogo variant="horizontal" height={44} priority />
        <span className="font-[family-name:var(--font-display)] text-xl font-bold text-white">
          Desapega UNIFOR
        </span>
      </div>

      <form
        onSubmit={handleSubmit}
        className="animate-fade-up delay-2 flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-white/15 bg-white p-6 shadow-2xl"
      >
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-navy">
          Complete seu perfil
        </h1>
        <p className="text-sm leading-relaxed text-muted">
          Para anunciar ou combinar um encontro no campus, precisamos do seu
          WhatsApp. Só quem demonstra interesse no seu anúncio recebe esse
          número.
        </p>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-navy/80">
          WhatsApp
          <input
            required
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(formatBrazilianPhoneInput(e.target.value))}
            placeholder="(85) 91234-5678"
            className={inputClass}
          />
        </label>

        {error && (
          <p className="animate-fade-in rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-navy py-3 font-semibold text-white shadow-sm transition-soft hover:-translate-y-0.5 hover:bg-brand disabled:opacity-60"
        >
          {submitting ? "Salvando..." : "Continuar"}
        </button>
      </form>
    </div>
  );
}

export default function CompletarPerfilPage() {
  return (
    <Suspense>
      <CompletarPerfilInner />
    </Suspense>
  );
}
