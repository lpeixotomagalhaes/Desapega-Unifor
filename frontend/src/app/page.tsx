"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ItemCard, ItemCardSkeleton } from "@/components/ItemCard";
import {
  api,
  CATEGORIES,
  type Category,
  type Item,
  type Stats,
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
  const [stats, setStats] = useState<Stats | null>(null);
  const [items, setItems] = useState<Item[] | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.getStats().then(setStats).catch(() => setError(true));
  }, []);

  useEffect(() => {
    setItems(null);
    api
      .getItems(category ? { category } : undefined)
      .then((data) => setItems(data.slice(0, 8)))
      .catch(() => setError(true));
  }, [category]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-bold text-emerald-700">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
              ♻
            </span>
            Desapega UNIFOR
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-stone-600 transition-soft hover:text-emerald-700"
            >
              Entrar
            </Link>
            <Link
              href="/app?tab=anunciar"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-soft hover:bg-emerald-700"
            >
              Anunciar item
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-b from-emerald-50 to-stone-50">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center sm:py-24">
            <span className="rounded-full border border-emerald-200 bg-white px-4 py-1 text-sm font-medium text-emerald-700">
              Economia circular no campus
            </span>
            <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-stone-900 sm:text-5xl">
              O que você não usa mais pode ser{" "}
              <span className="text-emerald-600">exatamente o que alguém precisa</span>
            </h1>
            <p className="max-w-2xl text-lg text-stone-600">
              Doe ou venda livros, calculadoras, jalecos, componentes e móveis
              para outros estudantes. Menos desperdício, mais acesso para quem
              está chegando na universidade.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/app?tab=anunciar"
                className="rounded-xl bg-emerald-600 px-8 py-3 font-semibold text-white shadow-md transition-soft hover:bg-emerald-700 hover:shadow-lg"
              >
                Quero anunciar
              </Link>
              <Link
                href="#vitrine"
                className="rounded-xl border border-stone-300 bg-white px-8 py-3 font-semibold text-stone-700 transition-soft hover:border-emerald-400 hover:text-emerald-700"
              >
                Buscar itens
              </Link>
            </div>
          </div>
        </section>

        {/* Estatísticas */}
        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Itens disponíveis", value: stats?.activeItems },
              { label: "Doações", value: stats?.donations },
              { label: "Desapegos concluídos", value: stats?.soldItems },
              { label: "Estudantes cadastrados", value: stats?.users },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-sm"
              >
                <p className="text-3xl font-extrabold text-emerald-600">
                  {stat.value ?? "—"}
                </p>
                <p className="mt-1 text-sm text-stone-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Vitrine */}
        <section id="vitrine" className="mx-auto max-w-6xl px-4 py-12">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-stone-900">
                Últimos anúncios
              </h2>
              <p className="text-stone-500">
                Itens recém-desapegados pela galera do campus
              </p>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            <button
              onClick={() => setCategory(null)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-soft ${
                category === null
                  ? "bg-emerald-600 text-white"
                  : "border border-stone-300 bg-white text-stone-600 hover:border-emerald-400"
              }`}
            >
              Todos
            </button>
            {(Object.keys(CATEGORIES) as Category[]).map((key) => (
              <button
                key={key}
                onClick={() => setCategory(key)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-soft ${
                  category === key
                    ? "bg-emerald-600 text-white"
                    : "border border-stone-300 bg-white text-stone-600 hover:border-emerald-400"
                }`}
              >
                {CATEGORIES[key]}
              </button>
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
                : items.map((item) => <ItemCard key={item.id} item={item} />)}
            </div>
          )}

          {items?.length === 0 && (
            <p className="rounded-xl border border-stone-200 bg-white p-8 text-center text-stone-500">
              Nenhum item nessa categoria ainda. Que tal ser a primeira pessoa a
              anunciar?
            </p>
          )}

          <div className="mt-8 text-center">
            <Link
              href="/app"
              className="inline-block rounded-xl border border-emerald-600 px-6 py-3 font-semibold text-emerald-700 transition-soft hover:bg-emerald-600 hover:text-white"
            >
              Ver todos no app
            </Link>
          </div>
        </section>

        {/* Como funciona */}
        <section className="bg-white">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="mb-10 text-center text-2xl font-bold text-stone-900">
              Como funciona
            </h2>
            <div className="grid gap-6 sm:grid-cols-3">
              {STEPS.map((step, index) => (
                <div
                  key={step.title}
                  className="rounded-2xl border border-stone-200 p-6"
                >
                  <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700">
                    {index + 1}
                  </span>
                  <h3 className="mb-2 font-semibold text-stone-900">
                    {step.title}
                  </h3>
                  <p className="text-sm text-stone-500">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-8 text-center text-sm text-stone-500">
          <p className="font-semibold text-emerald-700">Desapega UNIFOR</p>
          <p>
            Projeto de economia circular do campus — Desafio Técnico Laboratório
            Vortex 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
