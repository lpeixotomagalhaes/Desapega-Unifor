"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { HeroCarousel } from "@/components/HeroCarousel";
import { ItemCard, ItemCardSkeleton } from "@/components/ItemCard";
import { Reveal } from "@/components/Reveal";
import { SiteFooter } from "@/components/SiteFooter";
import {
  api,
  CATEGORIES,
  type Category,
  type Item,
} from "@/lib/api";

const STEPS: {
  title: string;
  description: string;
  Icon: (props: { className?: string }) => ReactNode;
}[] = [
  {
    title: "Anuncie o que não usa mais",
    description:
      "Aquele livro de Cálculo, a calculadora ou o jaleco parado no armário podem ajudar outro estudante.",
    Icon: AnnounceIcon,
  },
  {
    title: "Doe ou venda por um precinho",
    description:
      "Você escolhe: desapega de graça ou cobra um valor simbólico. Tudo entre estudantes do campus.",
    Icon: TagIcon,
  },
  {
    title: "Combine a entrega no campus",
    description:
      "Sem frete e sem burocracia: é só combinar de se encontrar no bloco, na cantina ou na biblioteca.",
    Icon: PinIcon,
  },
];

const STEP_VARIANTS = ["slide-left", "zoom-in", "slide-right"] as const;

const CARD_VARIANTS = [
  "slide-up",
  "slide-left",
  "zoom-in",
  "slide-right",
  "fade-up",
  "scale",
  "slide-up",
  "slide-left",
] as const;

export default function LandingPage() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setItems(null);
    setError(false);
    api
      .getItems(category ? { category } : undefined)
      .then((data) => {
        if (!cancelled) setItems(data.slice(0, 8));
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [category]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-mist">
      <main className="flex-1">
        <HeroCarousel />

        <section className="section-blend section-from-hero relative z-[1] -mt-10 border-b border-fog/70 bg-gradient-to-b from-white via-white to-mist pt-4 sm:-mt-14 sm:pt-6">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
            <Reveal variant="slide-down" className="mb-3 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
                Passo a passo
              </p>
            </Reveal>
            <Reveal
              as="h2"
              variant="slide-up"
              delay={50}
              className="mb-3 text-center font-[family-name:var(--font-display)] text-2xl font-bold text-navy sm:text-3xl"
            >
              Como funciona
            </Reveal>
            <Reveal
              variant="fade"
              delay={100}
              className="mx-auto mb-12 max-w-xl text-center"
            >
              <p className="text-sm text-muted sm:text-base">
                Três passos simples pra desapegar no campus — sem frete e sem
                complicação.
              </p>
            </Reveal>

            <div className="relative grid gap-5 sm:grid-cols-3 sm:gap-6">
              <div
                className="pointer-events-none absolute left-[16%] right-[16%] top-10 hidden h-px bg-gradient-to-r from-transparent via-brand/35 to-transparent sm:block"
                aria-hidden
              />

              {STEPS.map((step, index) => (
                <Reveal
                  key={step.title}
                  delay={index * 90}
                  variant={STEP_VARIANTS[index] ?? "fade-up"}
                  className="hover-lift relative rounded-2xl border border-fog bg-white p-6 shadow-sm"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-navy to-brand text-white shadow-md shadow-brand/20">
                      <step.Icon className="h-6 w-6" />
                    </span>
                    <span className="font-[family-name:var(--font-display)] text-sm font-bold text-brand">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mb-2 font-[family-name:var(--font-display)] text-lg font-semibold text-navy">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted">
                    {step.description}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section
          id="vitrine"
          className="section-blend section-to-mist relative scroll-mt-20 bg-gradient-to-b from-mist via-[#e8eef8] to-[#dfe8f6] px-4 py-12 sm:px-6 sm:py-14"
        >
          <div className="mx-auto max-w-7xl">
            <Reveal variant="slide-left" className="mb-6">
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-navy sm:text-3xl">
                Últimos anúncios
              </h2>
              <p className="text-muted">
                Itens recém-desapegados pela galera do campus
              </p>
            </Reveal>

            <Reveal variant="slide-right" delay={40} className="mb-6 flex flex-wrap gap-2">
              <FilterChip
                active={category === null}
                onClick={() => setCategory(null)}
                label="Todos"
              />
              {(Object.keys(CATEGORIES) as Category[]).map((key) => (
                <FilterChip
                  key={key}
                  active={category === key}
                  onClick={() => setCategory(key)}
                  label={CATEGORIES[key]}
                />
              ))}
            </Reveal>

            {error ? (
              <Reveal variant="zoom-in">
                <p className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-amber-800">
                  Não foi possível carregar os anúncios. Verifique se a API
                  está rodando.
                </p>
              </Reveal>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {items === null
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <ItemCardSkeleton key={i} />
                    ))
                  : items.map((item, i) => (
                      <Reveal
                        key={item.id}
                        delay={Math.min(i, 7) * 60}
                        variant={CARD_VARIANTS[i % CARD_VARIANTS.length]}
                      >
                        <ItemCard item={item} />
                      </Reveal>
                    ))}
              </div>
            )}

            {items?.length === 0 && (
              <Reveal variant="fade-up">
                <p className="rounded-xl border border-fog bg-white p-8 text-center text-muted">
                  Nenhum item nessa categoria ainda. Que tal ser a primeira
                  pessoa a anunciar?
                </p>
              </Reveal>
            )}

            <Reveal variant="scale" delay={80} className="mt-8 text-center">
              <Link
                href="/app"
                className="inline-block rounded-xl border-2 border-navy px-6 py-3 font-semibold text-navy transition-[color,background-color,border-color,box-shadow] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-navy hover:bg-navy hover:text-white hover:shadow-[0_14px_28px_-12px_rgb(10_31_77_/_0.2)]"
              >
                Ver todos no app
              </Link>
            </Reveal>
          </div>
        </section>

        <div className="footer-blend max-md:hidden" aria-hidden />
      </main>

      <SiteFooter className="max-md:hidden" />
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition-soft ${
        active
          ? "bg-navy text-white shadow-sm"
          : "border border-fog bg-white text-muted hover:-translate-y-0.5 hover:border-brand hover:text-brand"
      }`}
    >
      {label}
    </button>
  );
}

function AnnounceIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10.5v3c0 .8.5 1.5 1.2 1.8l3.3 1.1V8.6L5.2 9.7C4.5 10 4 10.7 4 10.5z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 8.6 18 5.5v13l-9.5-3.1"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 15.4v2.3a1.8 1.8 0 0 0 2.7 1.5l.6-.4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TagIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3.5 12.2 11.3 4.4a2 2 0 0 1 1.4-.6H19a1.5 1.5 0 0 1 1.5 1.5v6.3a2 2 0 0 1-.6 1.4l-7.8 7.8a2 2 0 0 1-2.8 0L3.5 15a2 2 0 0 1 0-2.8z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="16.2" cy="7.8" r="1.35" fill="currentColor" />
    </svg>
  );
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21s6.5-5.2 6.5-11A6.5 6.5 0 0 0 5.5 10c0 5.8 6.5 11 6.5 11z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.25" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}
