"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { BrandLogo, DesapegaWordmark } from "@/components/BrandLogo";
import { ItemCard, ItemCardSkeleton } from "@/components/ItemCard";
import {
  api,
  ApiError,
  CATEGORIES,
  type Category,
  type CreateItemInput,
  type Item,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Tab = "explorar" | "anunciar" | "meus";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "explorar", label: "Explorar", icon: "🔍" },
  { id: "anunciar", label: "Anunciar", icon: "➕" },
  { id: "meus", label: "Meus anúncios", icon: "📦" },
];

function AppShell() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab");
  const [tab, setTab] = useState<Tab>(
    initialTab === "anunciar" || initialTab === "meus" ? initialTab : "explorar",
  );
  const { user, signOut } = useAuth();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col bg-mist">
      <header className="sticky top-0 z-20 flex animate-fade-in items-center justify-between border-b border-fog bg-white/95 px-4 py-3 backdrop-blur">
        <Link href="/" className="group flex items-center gap-2.5">
          <BrandLogo
            mark="blue"
            height={30}
            className="transition-soft group-hover:scale-105"
          />
          <DesapegaWordmark className="text-base" />
        </Link>
        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted">
              Olá, {user.name.split(" ")[0]}
            </span>
            <button
              onClick={signOut}
              className="text-sm font-medium text-red-500 transition-soft hover:text-red-600"
            >
              Sair
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="rounded-lg bg-navy px-4 py-1.5 text-sm font-semibold text-white transition-soft hover:bg-brand"
          >
            Entrar
          </Link>
        )}
      </header>

      <main className="flex-1 animate-fade-up px-4 pb-24 pt-4">
        {tab === "explorar" && <ExploreTab />}
        {tab === "anunciar" && <NewItemTab onCreated={() => setTab("meus")} />}
        {tab === "meus" && <MyItemsTab />}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-fog bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-semibold transition-soft ${
                tab === t.id
                  ? "text-navy"
                  : "text-muted hover:text-brand"
              }`}
            >
              <span
                className={`text-lg leading-none transition-soft ${
                  tab === t.id ? "scale-110" : ""
                }`}
              >
                {t.icon}
              </span>
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function ExploreTab() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    setItems(null);
    setError(false);
    const timeout = setTimeout(() => {
      api
        .getItems({
          category: category ?? undefined,
          search: search || undefined,
        })
        .then(setItems)
        .catch(() => setError(true));
    }, 300); // debounce da busca
    return () => clearTimeout(timeout);
  }, [category, search]);

  return (
    <div className="flex flex-col gap-4">
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar livros, calculadoras, jalecos..."
        className="w-full rounded-xl border border-fog bg-white px-4 py-3 text-sm outline-none transition-soft focus:border-brand focus:ring-2 focus:ring-brand/20"
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setCategory(null)}
          className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-soft ${
            category === null
              ? "bg-navy text-white"
              : "border border-fog bg-white text-muted"
          }`}
        >
          Todos
        </button>
        {(Object.keys(CATEGORIES) as Category[]).map((key) => (
          <button
            key={key}
            onClick={() => setCategory(key)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-soft ${
              category === key
                ? "bg-navy text-white"
                : "border border-fog bg-white text-muted"
            }`}
          >
            {CATEGORIES[key]}
          </button>
        ))}
      </div>

      {error ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-800">
          Não foi possível carregar os anúncios. Você está offline ou a API não
          está rodando.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {items === null
            ? Array.from({ length: 4 }).map((_, i) => (
                <ItemCardSkeleton key={i} />
              ))
            : items.map((item) => <ItemCard key={item.id} item={item} />)}
        </div>
      )}

      {items?.length === 0 && (
        <p className="rounded-xl border border-fog bg-white p-8 text-center text-sm text-muted">
          Nenhum item encontrado. Tente outra busca ou categoria.
        </p>
      )}
    </div>
  );
}

function LoginPrompt({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-fog bg-white p-8 text-center">
      <span className="text-4xl">🔒</span>
      <p className="text-muted">{message}</p>
      <div className="flex gap-3">
        <Link
          href="/login"
          className="rounded-xl bg-navy px-6 py-2.5 font-semibold text-white transition-soft hover:bg-brand"
        >
          Entrar
        </Link>
        <Link
          href="/registro"
          className="rounded-xl border border-fog px-6 py-2.5 font-semibold text-navy/80 transition-soft hover:border-brand"
        >
          Criar conta
        </Link>
      </div>
    </div>
  );
}

function NewItemTab({ onCreated }: { onCreated: () => void }) {
  const { user, token, loading } = useAuth();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "" as Category | "",
    price: "",
    isDonation: false,
    imageUrl: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) return null;
  if (!user || !token) {
    return <LoginPrompt message="Você precisa entrar para anunciar um item." />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.category) {
      setError("Escolha uma categoria.");
      return;
    }
    if (!form.isDonation && !form.price) {
      setError("Informe um preço ou marque como doação.");
      return;
    }

    const payload: CreateItemInput = {
      title: form.title,
      description: form.description,
      category: form.category,
      isDonation: form.isDonation,
      imageUrl: form.imageUrl,
      ...(form.isDonation ? {} : { price: Number(form.price) }),
    };

    setSubmitting(true);
    try {
      await api.createItem(token, payload);
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao criar anúncio.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-fog bg-white px-4 py-3 text-sm outline-none transition-soft focus:border-brand focus:ring-2 focus:ring-brand/20";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-navy">Anunciar item</h1>

      <label className="flex flex-col gap-1.5 text-sm font-medium text-navy/80">
        Título
        <input
          required
          minLength={3}
          maxLength={100}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Ex: Livro de Cálculo Vol. 1"
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium text-navy/80">
        Descrição
        <textarea
          required
          minLength={10}
          maxLength={1000}
          rows={4}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Descreva o estado do item, detalhes e local de retirada"
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium text-navy/80">
        Categoria
        <select
          required
          value={form.category}
          onChange={(e) =>
            setForm({ ...form, category: e.target.value as Category })
          }
          className={inputClass}
        >
          <option value="" disabled>
            Selecione uma categoria
          </option>
          {(Object.keys(CATEGORIES) as Category[]).map((key) => (
            <option key={key} value={key}>
              {CATEGORIES[key]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-3 rounded-xl border border-brand/25 bg-mist px-4 py-3 text-sm font-medium text-navy">
        <input
          type="checkbox"
          checked={form.isDonation}
          onChange={(e) => setForm({ ...form, isDonation: e.target.checked })}
          className="h-4 w-4 accent-brand"
        />
        É doação (sem preço)
      </label>

      {!form.isDonation && (
        <label className="flex flex-col gap-1.5 text-sm font-medium text-navy/80">
          Preço (R$)
          <input
            type="number"
            min={0}
            step="0.01"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            placeholder="Ex: 50.00"
            className={inputClass}
          />
        </label>
      )}

      <label className="flex flex-col gap-1.5 text-sm font-medium text-navy/80">
        URL da imagem
        <input
          required
          type="url"
          value={form.imageUrl}
          onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
          placeholder="https://exemplo.com/foto-do-item.jpg"
          className={inputClass}
        />
      </label>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-xl bg-navy py-3 font-semibold text-white shadow-sm transition-soft hover:bg-brand disabled:opacity-60"
      >
        {submitting ? "Publicando..." : "Publicar anúncio"}
      </button>
    </form>
  );
}

function MyItemsTab() {
  const { user, token, loading } = useAuth();
  const [items, setItems] = useState<Item[] | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    if (!token) return;
    api.getMyItems(token).then(setItems).catch(() => setError(true));
  }, [token]);

  useEffect(load, [load]);

  if (loading) return null;
  if (!user || !token) {
    return (
      <LoginPrompt message="Entre para ver e gerenciar seus anúncios." />
    );
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api.deleteItem(token, id);
      setItems((prev) => prev?.filter((item) => item.id !== id) ?? null);
    } catch {
      setError(true);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-navy">Meus anúncios</h1>

      {error && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-800">
          Algo deu errado. Tente novamente.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {items === null
          ? Array.from({ length: 2 }).map((_, i) => <ItemCardSkeleton key={i} />)
          : items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onDelete={handleDelete}
                deleting={deletingId === item.id}
              />
            ))}
      </div>

      {items?.length === 0 && (
        <p className="rounded-xl border border-fog bg-white p-8 text-center text-sm text-muted">
          Você ainda não anunciou nada. Use a aba “Anunciar” para desapegar do
          primeiro item!
        </p>
      )}
    </div>
  );
}

export default function AppPage() {
  return (
    <Suspense>
      <AppShell />
    </Suspense>
  );
}
