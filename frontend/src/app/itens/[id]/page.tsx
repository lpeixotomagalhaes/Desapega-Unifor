"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CampusDeliveryTip } from "@/components/CampusDeliveryTip";
import {
  api,
  ApiError,
  CATEGORIES,
  formatCategories,
  formatPrice,
  itemStatusLabel,
  resolveImageUrl,
  type Item,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { CAMPUS_DELIVERY_SUPPORT_FAQ } from "@/lib/campusDelivery";

export default function ItemDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [item, setItem] = useState<Item | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [interestState, setInterestState] = useState<
    "idle" | "sending" | "sent"
  >("idle");
  const [interestError, setInterestError] = useState<string | null>(null);

  const id = params.id;

  useEffect(() => {
    let cancelled = false;
    setItem(null);
    setNotFound(false);
    api
      .getItem(id)
      .then((data) => {
        if (!cancelled) setItem(data);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleInterest = useCallback(async () => {
    if (authLoading) return;
    const returnUrl = `/itens/${id}`;

    if (!user || !token) {
      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }
    if (!user.phone) {
      router.push(`/completar-perfil?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }

    setInterestError(null);
    setInterestState("sending");
    try {
      const { whatsappUrl } = await api.expressInterest(token, id);
      setInterestState("sent");
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setInterestState("idle");
      setInterestError(
        err instanceof ApiError
          ? err.message
          : "Não foi possível registrar seu interesse.",
      );
    }
  }, [authLoading, user, token, id, router]);

  if (notFound) {
    return (
      <div className="mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <span className="text-4xl">🔎</span>
        <h1 className="text-xl font-bold text-navy">Anúncio não encontrado</h1>
        <p className="text-muted">
          Esse item pode ter sido removido ou já foi concluído.
        </p>
        <Link
          href="/app"
          className="rounded-xl bg-navy px-6 py-2.5 font-semibold text-white transition-soft hover:bg-brand"
        >
          Voltar para o app
        </Link>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <div className="grid animate-pulse gap-8 md:grid-cols-2">
          <div className="h-72 rounded-2xl bg-fog sm:h-96" />
          <div className="space-y-3">
            <div className="h-7 w-2/3 rounded bg-fog" />
            <div className="h-4 w-1/3 rounded bg-mist" />
            <div className="h-9 w-1/2 rounded bg-fog" />
            <div className="h-24 rounded bg-mist" />
          </div>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === item.user.id;
  const isConcluded = item.status === "CONCLUIDO";
  const statusLabel = itemStatusLabel(item);

  let ctaLabel = "Tenho interesse";
  if (isOwner) ctaLabel = "Este é o seu anúncio";
  else if (isConcluded) ctaLabel = statusLabel ?? "Indisponível";
  else if (interestState === "sending") ctaLabel = "Abrindo WhatsApp...";
  else if (interestState === "sent") ctaLabel = "Abrir WhatsApp novamente";

  const ctaDisabled = isOwner || isConcluded || interestState === "sending";

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:py-8">
      <Link
        href="/app"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-soft hover:text-navy"
      >
        ← Voltar
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="relative h-72 w-full overflow-hidden rounded-2xl bg-mist sm:h-96">
          <Image
            src={resolveImageUrl(item.imageUrl)}
            alt={item.title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className={`object-cover ${isConcluded ? "grayscale-[35%]" : ""}`}
            priority
          />
          <span className="absolute left-4 top-4 max-w-[70%] truncate rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-navy shadow-sm backdrop-blur">
            {formatCategories(item.categories)}
          </span>
          {statusLabel && (
            <span
              className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm ${
                isConcluded ? "bg-navy/80" : "bg-amber-500"
              }`}
            >
              {statusLabel}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-navy">
              {item.title}
            </h1>
            <p className="mt-1 text-sm text-muted">
              Anunciado por {item.user.name}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {item.categories.map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-fog bg-mist px-2.5 py-0.5 text-xs font-semibold text-navy/80"
                >
                  {CATEGORIES[c]}
                </span>
              ))}
            </div>
          </div>

          <p
            className={`text-3xl font-extrabold ${item.isDonation ? "text-brand" : "text-navy"}`}
          >
            {formatPrice(item)}
          </p>

          <div>
            <h2 className="mb-1 text-sm font-semibold text-navy">Descrição</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted">
              {item.description}
            </p>
          </div>

          <CampusDeliveryTip variant="form" />

          <div className="mt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleInterest}
              disabled={ctaDisabled}
              className="rounded-xl bg-navy py-3.5 font-semibold text-white shadow-sm transition-soft hover:-translate-y-0.5 hover:bg-brand disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {ctaLabel}
            </button>
            {interestError && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                {interestError}
              </p>
            )}
            <p className="text-xs leading-relaxed text-muted">
              Vocês combinam local e horário no campus pelo WhatsApp. Pague
              somente após conferir o item pessoalmente — a Unifor não se
              responsabiliza por negociações feitas fora da plataforma.
            </p>
          </div>

          <details className="group rounded-xl border border-fog bg-white px-4 py-3">
            <summary className="cursor-pointer list-none text-sm font-semibold text-navy marker:content-none">
              <span className="inline-flex items-center gap-1.5">
                Dicas de segurança para o encontro
                <span className="text-muted transition-soft group-open:rotate-180" aria-hidden>
                  ▾
                </span>
              </span>
            </summary>
            <ul className="mt-3 space-y-2.5">
              {CAMPUS_DELIVERY_SUPPORT_FAQ.map((tip) => (
                <li key={tip.title} className="rounded-lg bg-mist/80 px-3 py-2">
                  <p className="text-xs font-semibold text-navy">{tip.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted">
                    {tip.body}
                  </p>
                </li>
              ))}
            </ul>
          </details>
        </div>
      </div>
    </div>
  );
}
