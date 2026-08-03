"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { InterestOrderForm } from "@/components/InterestOrderForm";
import { ItemComments } from "@/components/ItemComments";
import { ItemImageCarousel } from "@/components/ItemImageCarousel";
import {
  api,
  ApiError,
  CATEGORIES,
  formatCategories,
  formatPrice,
  isAdmin,
  itemStatusLabel,
  type Item,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function ItemDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, token } = useAuth();
  const [item, setItem] = useState<Item | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [modReason, setModReason] = useState("");
  const [modBusy, setModBusy] = useState(false);
  const [modError, setModError] = useState<string | null>(null);

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

  if (notFound) {
    return (
      <div className="mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
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

  const isConcluded = item.status === "CONCLUIDO";
  const isSuspended = item.status === "SUSPENSO";
  const statusLabel = itemStatusLabel(item);
  const canModerate = Boolean(token && isAdmin(user));

  const moderateItem = async (mode: "suspend" | "restore" | "delete") => {
    if (!token) return;
    const ok = window.confirm(
      mode === "delete"
        ? "Excluir este anúncio permanentemente? Não dá para desfazer."
        : mode === "restore"
          ? "Reativar este anúncio no feed?"
          : "Suspender temporariamente? O anúncio sai do feed, mas pode ser reativado.",
    );
    if (!ok) return;
    setModBusy(true);
    setModError(null);
    try {
      if (mode === "delete") {
        await api.adminDeleteItem(token, item.id, {
          reason: modReason.trim() || undefined,
        });
        router.push("/dashboard/items");
        return;
      }
      if (mode === "restore") {
        const updated = await api.restoreAdminItem(token, item.id);
        setItem(updated);
        setModReason("");
        return;
      }
      const updated = await api.takeDownItem(token, item.id, {
        reason: modReason.trim() || undefined,
      });
      setItem(updated);
      setModReason("");
    } catch (err) {
      setModError(
        err instanceof ApiError ? err.message : "Falha na moderação.",
      );
    } finally {
      setModBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:py-8">
      <Link
        href="/app"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-soft hover:text-navy"
      >
        ← Voltar
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <ItemImageCarousel
            item={item}
            heightClass="h-72 sm:h-96"
            roundedClass="rounded-2xl"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
            enableNav
            imageClassName={
              isConcluded || isSuspended ? "grayscale-[35%]" : ""
            }
            overlayTopLeft={
              <span className="absolute left-4 top-4 z-[5] max-w-[70%] truncate rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-navy shadow-sm backdrop-blur">
                {formatCategories(item.categories)}
              </span>
            }
            overlayTopRight={
              statusLabel ? (
                <span
                  className={`absolute right-4 top-4 z-[5] rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm ${
                    isSuspended
                      ? "bg-red-600"
                      : isConcluded
                        ? "bg-navy/80"
                        : "bg-amber-500"
                  }`}
                >
                  {statusLabel}
                </span>
              ) : null
            }
          />
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-navy">
              {item.title}
            </h1>
            <p className="mt-1 text-sm text-muted">
              Anunciado por{" "}
              <Link
                href={`/perfil/${item.user.id}`}
                className="font-medium text-navy transition-soft hover:text-brand hover:underline"
              >
                {item.user.name}
              </Link>
              {user?.id === item.user.id ? " (você)" : ""}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(item.categories ?? []).map((c) => (
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

          {canModerate && (
            <div className="rounded-2xl border border-red-200 bg-red-50/60 p-4">
              <p className="text-sm font-semibold text-navy">Moderação</p>
              <p className="mt-1 text-xs text-muted">
                Ações disponíveis para administradores.
              </p>
              <textarea
                value={modReason}
                onChange={(e) => setModReason(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="Motivo (opcional)"
                className="mt-3 w-full rounded-lg border border-fog bg-white px-3 py-2 text-sm outline-none focus:border-brand"
              />
              {modError && (
                <p className="mt-2 text-sm text-red-700">{modError}</p>
              )}
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  disabled={modBusy || isConcluded || isSuspended}
                  onClick={() => void moderateItem("suspend")}
                  className="flex-1 rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  Suspender
                </button>
                {isSuspended && (
                  <button
                    type="button"
                    disabled={modBusy}
                    onClick={() => void moderateItem("restore")}
                    className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    Reativar
                  </button>
                )}
                <button
                  type="button"
                  disabled={modBusy}
                  onClick={() => void moderateItem("delete")}
                  className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  Excluir
                </button>
              </div>
              <p className="mt-2 text-xs text-muted">
                Suspender: sai do feed e pode voltar. Excluir: apaga de vez.
              </p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs font-medium">
                <Link
                  href={`/perfil/${item.user.id}`}
                  className="text-brand hover:underline"
                >
                  Ver perfil do vendedor
                </Link>
                <Link
                  href="/dashboard/items"
                  className="text-brand hover:underline"
                >
                  Painel de anúncios
                </Link>
                <Link
                  href="/dashboard/users"
                  className="text-brand hover:underline"
                >
                  Banir / suspender usuários
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-2">
        <ItemComments itemId={item.id} />
        <div className="min-w-0">
          <InterestOrderForm item={item} />
        </div>
      </div>
    </div>
  );
}
