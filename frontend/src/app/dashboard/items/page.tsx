"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  api,
  ApiError,
  formatPrice,
  resolveImageUrl,
  type AccountStatus,
  type Item,
  type ItemStatus,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";

type AdminItem = Item & {
  user: {
    id: string;
    name: string;
    email: string;
    accountStatus?: AccountStatus;
  };
};

const STATUS_LABEL: Record<ItemStatus, string> = {
  ATIVO: "Ativo",
  NEGOCIANDO: "Negociando",
  CONCLUIDO: "Concluído",
  SUSPENSO: "Suspenso",
};

export default function DashboardItemsPage() {
  const { token } = useAuth();
  const [items, setItems] = useState<AdminItem[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ItemStatus | "">("");
  const [selected, setSelected] = useState<AdminItem | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api.getAdminItems(token, {
        limit: 40,
        search: search.trim() || undefined,
        status: status || undefined,
      });
      setItems(data.items);
      setError(null);
    } catch {
      setError("Não foi possível carregar os anúncios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, search, status]);

  const runAction = async (mode: "suspend" | "restore" | "delete") => {
    if (!token || !selected) return;
    const confirmMsg =
      mode === "delete"
        ? `Excluir permanentemente "${selected.title}"? Esta ação não pode ser desfeita.`
        : mode === "restore"
          ? `Reativar "${selected.title}" no feed?`
          : `Suspender temporariamente "${selected.title}"? O anúncio sai do feed, mas pode ser reativado depois.`;
    if (!window.confirm(confirmMsg)) return;

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      if (mode === "delete") {
        await api.adminDeleteItem(token, selected.id, {
          reason: reason.trim() || undefined,
        });
        setItems((prev) => prev.filter((i) => i.id !== selected.id));
        setSelected(null);
        setMessage("Anúncio excluído permanentemente.");
      } else if (mode === "restore") {
        const updated = await api.restoreAdminItem(token, selected.id);
        setItems((prev) =>
          prev.map((i) =>
            i.id === updated.id ? { ...i, ...updated, user: i.user } : i,
          ),
        );
        setSelected((prev) =>
          prev && prev.id === updated.id
            ? { ...prev, ...updated, user: prev.user }
            : prev,
        );
        setMessage("Anúncio reativado no feed.");
      } else {
        const updated = await api.takeDownItem(token, selected.id, {
          reason: reason.trim() || undefined,
        });
        setItems((prev) =>
          prev.map((i) =>
            i.id === updated.id ? { ...i, ...updated, user: i.user } : i,
          ),
        );
        setSelected((prev) =>
          prev && prev.id === updated.id
            ? { ...prev, ...updated, user: prev.user }
            : prev,
        );
        setMessage("Anúncio suspenso temporariamente.");
      }
      setReason("");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Falha ao moderar anúncio.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy">Anúncios</h1>
        <p className="mt-1 text-sm text-muted">
          <strong>Suspender</strong> tira do feed temporariamente (dá para
          reativar). <strong>Excluir</strong> apaga o anúncio de vez.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <input
          type="search"
          placeholder="Buscar título, nome ou e-mail…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-fog bg-white px-3 py-2 text-sm outline-none focus:border-brand sm:max-w-xs"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as ItemStatus | "")}
          className="rounded-lg border border-fog bg-white px-3 py-2 text-sm outline-none focus:border-brand"
        >
          <option value="">Todos os status</option>
          <option value="ATIVO">Ativos</option>
          <option value="NEGOCIANDO">Negociando</option>
          <option value="SUSPENSO">Suspensos</option>
          <option value="CONCLUIDO">Concluídos</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-emerald-700">{message}</p>}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="overflow-x-auto rounded-xl border border-fog bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-fog bg-mist/50 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Anúncio</th>
                <th className="px-4 py-3 font-medium">Vendedor</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Preço</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted">
                    Carregando…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted">
                    Nenhum anúncio encontrado.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => {
                      setSelected(item);
                      setReason("");
                      setMessage(null);
                    }}
                    className={`cursor-pointer border-b border-fog last:border-0 hover:bg-mist/40 ${
                      selected?.id === item.id ? "bg-mist/60" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-mist">
                          <Image
                            src={resolveImageUrl(item.imageUrl)}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="44px"
                          />
                        </div>
                        <span className="line-clamp-2 font-medium text-navy">
                          {item.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      <div className="font-medium text-navy">{item.user.name}</div>
                      <div className="text-xs">{item.user.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      {STATUS_LABEL[item.status]}
                    </td>
                    <td className="px-4 py-3 text-muted">{formatPrice(item)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <aside className="rounded-xl border border-fog bg-white p-5">
          {!selected ? (
            <p className="text-sm text-muted">
              Selecione um anúncio para remover do feed ou excluir.
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-navy">
                  {selected.title}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {selected.user.name} · {STATUS_LABEL[selected.status]}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <Link
                    href={`/itens/${selected.id}`}
                    className="font-medium text-brand hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Ver anúncio
                  </Link>
                  <Link
                    href={`/dashboard/users?email=${encodeURIComponent(selected.user.email)}`}
                    className="font-medium text-brand hover:underline"
                  >
                    Moderar vendedor
                  </Link>
                </div>
              </div>

              <label className="block text-sm font-medium text-navy">
                Motivo (opcional)
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={500}
                  className="mt-1 w-full rounded-lg border border-fog px-3 py-2 text-sm outline-none focus:border-brand"
                  placeholder="Ex.: conteúdo impróprio"
                />
              </label>

              <button
                type="button"
                disabled={
                  saving ||
                  selected.status === "SUSPENSO" ||
                  selected.status === "CONCLUIDO"
                }
                onClick={() => void runAction("suspend")}
                className="w-full rounded-lg bg-amber-600 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                Suspender temporariamente
              </button>
              {selected.status === "SUSPENSO" && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void runAction("restore")}
                  className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  Reativar no feed
                </button>
              )}
              <button
                type="button"
                disabled={saving}
                onClick={() => void runAction("delete")}
                className="w-full rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                Excluir permanentemente
              </button>
              <p className="text-xs text-muted">
                Suspender = some do feed, mas o registro fica e pode voltar.
                Excluir = apaga tudo, sem volta.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
