"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { CampusDeliveryTip } from "@/components/CampusDeliveryTip";
import { ItemCard, ItemCardSkeleton } from "@/components/ItemCard";
import { ItemStatusTabs } from "@/components/ItemStatusTabs";
import { OnboardingTour } from "@/components/OnboardingTour";
import { Reveal } from "@/components/Reveal";
import {
  api,
  ApiError,
  CATEGORIES,
  type Category,
  type CreateItemInput,
  type Item,
  type ItemInterest,
} from "@/lib/api";
import { useAuthRedirect } from "@/lib/auth";

type Tab = "explorar" | "anunciar" | "meus";

const DESKTOP_TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "explorar", label: "Explorar", icon: "🔍" },
  { id: "anunciar", label: "Anunciar", icon: "➕" },
  { id: "meus", label: "Meus anúncios", icon: "📦" },
];

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

function parseTab(value: string | null): Tab {
  return value === "anunciar" || value === "meus" ? value : "explorar";
}

function AppShell() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = parseTab(searchParams.get("tab"));
  const search = searchParams.get("q") ?? "";

  const selectTab = useCallback(
    (next: Tab) => {
      const params = new URLSearchParams();
      if (next !== "explorar") params.set("tab", next);
      const q = search.trim();
      if (q) params.set("q", q);
      const qs = params.toString();
      router.replace(qs ? `/app?${qs}` : "/app", { scroll: false });
    },
    [router, search],
  );

  return (
    <div className="mx-auto flex min-h-0 w-full flex-1 flex-col bg-mist md:max-w-7xl">
      <OnboardingTour />

      <nav className="hidden gap-1 border-b border-fog px-4 pt-2 md:flex">
        {DESKTOP_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => selectTab(t.id)}
            className={`rounded-t-lg px-4 py-2.5 text-sm font-semibold transition-soft ${
              tab === t.id
                ? "border-b-2 border-navy text-navy"
                : "border-b-2 border-transparent text-muted hover:text-navy"
            }`}
          >
            <span className="mr-1.5" aria-hidden>
              {t.icon}
            </span>
            {t.label}
          </button>
        ))}
      </nav>

      <main className="flex-1 animate-fade-up px-4 pb-6 pt-4 md:pb-10">
        {tab === "explorar" && <ExploreTab search={search} />}
        {tab === "anunciar" && (
          <NewItemTab onCreated={() => selectTab("meus")} />
        )}
        {tab === "meus" && (
          <MyItemsTab view={searchParams.get("view")} />
        )}
      </main>
    </div>
  );
}

function ExploreTab({ search }: { search: string }) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setItems(null);
    setError(false);
    const timeout = setTimeout(() => {
      api
        .getItems({
          category: category ?? undefined,
          search: search.trim() || undefined,
        })
        .then(setItems)
        .catch(() => setError(true));
    }, 300); // debounce da busca
    return () => clearTimeout(timeout);
  }, [category, search]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
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
            type="button"
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items === null
            ? Array.from({ length: 8 }).map((_, i) => (
                <ItemCardSkeleton key={i} />
              ))
            : items.map((item, i) => (
                <Reveal
                  key={item.id}
                  delay={Math.min(i, 7) * 55}
                  variant={CARD_VARIANTS[i % CARD_VARIANTS.length]}
                >
                  <ItemCard item={item} />
                </Reveal>
              ))}
        </div>
      )}

      {items?.length === 0 && (
        <Reveal variant="fade-up">
          <p className="rounded-xl border border-fog bg-white p-8 text-center text-sm text-muted">
            Nenhum item encontrado. Tente outra busca ou categoria.
          </p>
        </Reveal>
      )}
    </div>
  );
}

function NewItemTab({ onCreated }: { onCreated: () => void }) {
  const router = useRouter();
  const { user, token, ready } = useAuthRedirect();
  const [form, setForm] = useState({
    title: "",
    description: "",
    categories: [] as Category[],
    price: "",
    isDonation: false,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ready && user && !user.phone) {
      router.push(
        `/completar-perfil?returnUrl=${encodeURIComponent("/app?tab=anunciar")}`,
      );
    }
  }, [ready, user, router]);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  if (!ready || !token || !user?.phone) return null;

  const handleImageChange = (file: File | null) => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      return;
    }
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      setError("Envie uma imagem JPG, PNG, WEBP ou GIF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("A imagem deve ter no máximo 5 MB.");
      return;
    }
    setError(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.categories.length === 0) {
      setError("Escolha pelo menos uma categoria.");
      return;
    }
    if (!form.isDonation && !form.price) {
      setError("Informe um preço ou marque como doação.");
      return;
    }
    if (!imageFile) {
      setError("Selecione uma foto do item.");
      return;
    }

    setSubmitting(true);
    try {
      const { url } = await api.uploadImage(token, imageFile);
      const payload: CreateItemInput = {
        title: form.title,
        description: form.description,
        categories: form.categories,
        isDonation: form.isDonation,
        imageUrl: url,
        ...(form.isDonation ? {} : { price: Number(form.price) }),
      };
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
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-2xl flex-col gap-4">
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

      <CampusDeliveryTip variant="form" />

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-navy/80">
          Categorias{" "}
          <span className="font-normal text-muted">(pode marcar mais de uma)</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(CATEGORIES) as Category[]).map((key) => {
            const selected = form.categories.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setForm((prev) => ({
                    ...prev,
                    categories: selected
                      ? prev.categories.filter((c) => c !== key)
                      : [...prev.categories, key],
                  }));
                }}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-soft ${
                  selected
                    ? "bg-navy text-white"
                    : "border border-fog bg-white text-muted hover:border-brand hover:text-navy"
                }`}
                aria-pressed={selected}
              >
                {CATEGORIES[key]}
              </button>
            );
          })}
        </div>
      </fieldset>

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

      <div className="flex flex-col gap-1.5 text-sm font-medium text-navy/80">
        Foto do item
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-fog bg-white px-4 py-6 text-center transition-soft hover:border-brand hover:bg-mist/40">
          <input
            required
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)}
          />
          {imagePreview ? (
            <img
              src={imagePreview}
              alt="Pré-visualização"
              className="max-h-48 w-full rounded-lg object-cover"
            />
          ) : (
            <>
              <span className="text-2xl" aria-hidden>
                📷
              </span>
              <span className="text-sm font-semibold text-navy">
                Toque para escolher uma foto
              </span>
            </>
          )}
          <span className="text-xs font-normal text-muted">
            JPG, PNG, WEBP ou GIF · máx. 5 MB
            {imageFile ? ` · ${imageFile.name}` : ""}
          </span>
        </label>
      </div>

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

function MyItemsTab({ view }: { view: string | null }) {
  const { token, ready } = useAuthRedirect();
  const [items, setItems] = useState<Item[] | null>(null);
  const [interests, setInterests] = useState<ItemInterest[] | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const initialTab =
    view === "concluidos" ||
    view === "negociando" ||
    view === "interessados" ||
    view === "publicados"
      ? view
      : undefined;

  const load = useCallback(() => {
    if (!token) return;
    api.getMyItems(token).then(setItems).catch(() => setError(true));
    api.getMyInterests(token).then(setInterests).catch(() => setError(true));
  }, [token]);

  useEffect(load, [load]);

  if (!ready || !token) return null;

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

  const handleItemUpdated = (updated: Item) => {
    setItems(
      (prev) => prev?.map((item) => (item.id === updated.id ? updated : item)) ?? null,
    );
  };

  const handleInterestUpdated = (updated: ItemInterest) => {
    setInterests(
      (prev) =>
        prev?.map((row) => (row.id === updated.id ? { ...row, ...updated } : row)) ??
        null,
    );
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <h1 className="text-xl font-bold text-navy">
        {view === "concluidos" ? "Minhas vendas / doações" : "Meus anúncios"}
      </h1>

      {error && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-800">
          Algo deu errado. Tente novamente.
        </p>
      )}

      <ItemStatusTabs
        items={items}
        interests={interests}
        token={token}
        deletingId={deletingId}
        initialTab={initialTab}
        onDeleteItem={handleDelete}
        onItemUpdated={handleItemUpdated}
        onInterestUpdated={handleInterestUpdated}
      />
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
