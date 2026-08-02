"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Step = {
  emoji: string;
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    emoji: "➕",
    title: "Anuncie em poucos passos",
    body: "Na aba Anunciar, coloque título, descrição, foto e preço (ou marque como doação) — e publique. Seu item aparece só para quem está na Unifor.",
  },
  {
    emoji: "📦",
    title: "Acompanhe em Meus anúncios",
    body: "Lá você vê o que está publicado, em negociação, já concluído e quem demonstrou interesse nos seus itens.",
  },
  {
    emoji: "🔍",
    title: "Busca só do campus",
    body: "A busca no topo mostra apenas anúncios da Unifor — sem cidade, sem frete, sem complicação.",
  },
  {
    emoji: "💬",
    title: "Combine tudo pelo WhatsApp",
    body: "No anúncio, preencha o formulário de pedido (curso, valor e encontro no campus). Enviamos os dados no WhatsApp do vendedor e o pedido fica pendente até a confirmação.",
  },
];

export function OnboardingTour() {
  const { user, token, loading, refreshUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const closingRef = useRef(false);
  const titleId = useId();
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (loading || !user) return;
    if (!user.onboardingCompletedAt) setOpen(true);
  }, [loading, user]);

  const finish = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setOpen(false);
    if (token) {
      api
        .completeOnboarding(token)
        .catch(() => {
          // Falha silenciosa: pior caso, o tour reaparece no próximo carregamento.
        })
        .finally(() => {
          void refreshUser();
        });
    }
  }, [token, refreshUser]);

  useEffect(() => {
    if (!open) return;
    closeBtnRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, finish]);

  const next = () => {
    if (step >= STEPS.length - 1) {
      finish();
      return;
    }
    setStep((s) => s + 1);
  };

  if (!open) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-navy/45 p-4 backdrop-blur-[2px] sm:items-center"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) finish();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="animate-fade-up w-full max-w-sm overflow-hidden rounded-2xl border border-fog bg-white shadow-xl"
      >
        {/* Card visual — inspirado nas tips da OLX */}
        <div className="hero-glow relative flex h-40 items-center justify-center">
          <div className="absolute left-3 top-3 flex gap-1.5" aria-hidden>
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-soft ${
                  i === step ? "w-5 bg-white" : "w-1.5 bg-white/40"
                }`}
              />
            ))}
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={finish}
            aria-label="Fechar"
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white transition-soft hover:bg-white/25"
          >
            ✕
          </button>
          <span className="text-5xl" aria-hidden>
            {current.emoji}
          </span>
        </div>

        <div className="p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">
            {step + 1} de {STEPS.length}
          </p>
          <h2
            id={titleId}
            className="mt-1 font-[family-name:var(--font-display)] text-lg font-bold text-navy"
          >
            {current.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{current.body}</p>

          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={finish}
              className="text-sm font-medium text-muted transition-soft hover:text-navy"
            >
              Talvez depois
            </button>
            <button
              type="button"
              onClick={next}
              className="rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-soft hover:bg-brand"
            >
              {isLast ? "Entendi" : "Próximo"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
