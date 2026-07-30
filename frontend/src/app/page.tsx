"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { ItemCard, ItemCardSkeleton } from "@/components/ItemCard";
import {
  api,
  CATEGORIES,
  type Category,
  type Item,
} from "@/lib/api";

const STEPS = [
  {
    title: "Anuncie o que não usa mais",
    description:
      "Aquele livro de Cálculo, a calculadora ou o jaleco parado no armário podem ajudar outro estudante.",
  },
  {
    title: "Doe ou venda por um precinho",
    description:
      "Você escolhe: desapega de graça ou cobra um valor simbólico. Tudo entre estudantes do campus.",
  },
  {
    title: "Combine a entrega no campus",
    description:
      "Sem frete e sem burocracia: é só combinar de se encontrar no bloco, na cantina ou na biblioteca.",
  },
];

export default function LandingPage() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setItems(null);
    api
      .getItems(category ? { category } : undefined)
      .then((data) => setItems(data.slice(0, 8)))
      .catch(() => setError(true));
  }, [category]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <main className="flex-1">
        {/* Hero — brand-first, full-bleed navy */}
        <section className="hero-glow relative overflow-hidden text-white">
          <div className="pointer-events-none absolute -right-16 top-8 opacity-20 sm:right-8 sm:opacity-30">
            <BrandLogo mark="white" height={220} className="animate-fade-in delay-3" />
          </div>
          <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-16 sm:py-24 lg:py-28">
            <BrandLogo
              variant="horizontal"
              height={42}
              priority
              className="animate-fade-up"
            />
            <p className="animate-fade-up delay-1 max-w-xl font-[family-name:var(--font-display)] text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Desapega UNIFOR
            </p>
            <p className="animate-fade-up delay-2 max-w-xl text-lg text-white/80 sm:text-xl">
              Economia circular no campus: doe ou venda livros, calculadoras,
              jalecos e materiais — e ajude quem está chegando na universidade.
            </p>
            <div className="animate-fade-up delay-3 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/app?tab=anunciar"
                className="rounded-xl bg-white px-8 py-3.5 text-center font-semibold text-navy shadow-lg transition-soft hover:-translate-y-0.5 hover:bg-mist hover:shadow-xl"
              >
                Quero anunciar
              </Link>
              <Link
                href="#vitrine"
                className="rounded-xl border border-white/35 bg-white/5 px-8 py-3.5 text-center font-semibold text-white backdrop-blur transition-soft hover:-translate-y-0.5 hover:border-white/70 hover:bg-white/10"
              >
                Buscar itens
              </Link>
            </div>
          </div>
        </section>

        {/* Como funciona */}
        <section className="border-b border-fog bg-white">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
            <h2 className="mb-10 text-center font-[family-name:var(--font-display)] text-2xl font-bold text-navy sm:text-3xl">
              Como funciona
            </h2>
            <div className="grid gap-6 sm:grid-cols-3">
              {STEPS.map((step, index) => (
                <div
                  key={step.title}
                  className="hover-lift animate-fade-up rounded-2xl border border-fog bg-mist/50 p-6"
                  style={{ animationDelay: `${(index + 1) * 0.12}s` }}
                >
                  <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-navy font-[family-name:var(--font-display)] font-bold text-white">
                    {index + 1}
                  </span>
                  <h3 className="mb-2 font-semibold text-navy">{step.title}</h3>
                  <p className="text-sm text-muted">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Vitrine */}
        <section id="vitrine" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12">
          <div className="mb-6 animate-fade-up">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-navy sm:text-3xl">
              Últimos anúncios
            </h2>
            <p className="text-muted">
              Itens recém-desapegados pela galera do campus
            </p>
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
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
          </div>

          {error ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-amber-800">
              Não foi possível carregar os anúncios. Verifique se a API está
              rodando.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {items === null
                ? Array.from({ length: 4 }).map((_, i) => (
                    <ItemCardSkeleton key={i} />
                  ))
                : items.map((item, i) => (
                    <div
                      key={item.id}
                      className="animate-fade-up"
                      style={{ animationDelay: `${Math.min(i, 5) * 0.07}s` }}
                    >
                      <ItemCard item={item} />
                    </div>
                  ))}
            </div>
          )}

          {items?.length === 0 && (
            <p className="rounded-xl border border-fog bg-white p-8 text-center text-muted">
              Nenhum item nessa categoria ainda. Que tal ser a primeira pessoa a
              anunciar?
            </p>
          )}

          <div className="mt-8 text-center">
            <Link
              href="/app"
              className="inline-block rounded-xl border-2 border-navy px-6 py-3 font-semibold text-navy transition-soft hover:-translate-y-0.5 hover:bg-navy hover:text-white"
            >
              Ver todos no app
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-navy-deep text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-10 text-center">
          <BrandLogo variant="horizontal" height={36} />
          <p className="font-[family-name:var(--font-display)] text-lg font-semibold">
            Desapega UNIFOR
          </p>
          <p className="max-w-md text-sm text-white/65">
            Projeto de economia circular do campus — Desafio Técnico Laboratório
            Vortex 2026
          </p>
        </div>
      </footer>
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
