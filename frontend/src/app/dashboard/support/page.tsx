"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  api,
  ApiError,
  type SupportTicket,
  type SupportTicketStatus,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";

const STATUS_LABEL: Record<SupportTicketStatus, string> = {
  OPEN: "Aberto",
  IN_PROGRESS: "Em andamento",
  RESOLVED: "Resolvido",
  CLOSED: "Fechado",
};

export default function DashboardSupportPage() {
  const { token } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [statusFilter, setStatusFilter] = useState<SupportTicketStatus | "">("");
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [reply, setReply] = useState("");
  const [newStatus, setNewStatus] = useState<SupportTicketStatus>("IN_PROGRESS");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await api.getAdminSupportTickets(
        token,
        statusFilter || undefined,
      );
      setTickets(data);
      setError(null);
    } catch {
      setError("Não foi possível carregar os tickets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, statusFilter]);

  const openTicket = (ticket: SupportTicket) => {
    setSelected(ticket);
    setReply(ticket.adminReply ?? "");
    setNewStatus(
      ticket.status === "OPEN" ? "IN_PROGRESS" : ticket.status,
    );
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !selected) return;
    setSaving(true);
    try {
      const updated = await api.updateAdminSupportTicket(token, selected.id, {
        status: newStatus,
        adminReply: reply.trim() || undefined,
      });
      setTickets((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t)),
      );
      setSelected(updated);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Falha ao atualizar ticket.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy">Suporte</h1>
        <p className="mt-1 text-sm text-muted">
          Reclamações e pedidos enviados pelos usuários.
        </p>
      </div>

      <select
        value={statusFilter}
        onChange={(e) =>
          setStatusFilter(e.target.value as SupportTicketStatus | "")
        }
        className="rounded-lg border border-fog bg-white px-3 py-2 text-sm outline-none focus:border-brand"
      >
        <option value="">Todos os status</option>
        {(Object.keys(STATUS_LABEL) as SupportTicketStatus[]).map((s) => (
          <option key={s} value={s}>
            {STATUS_LABEL[s]}
          </option>
        ))}
      </select>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-fog bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-fog bg-mist/50 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Assunto</th>
              <th className="px-4 py-3 font-medium">Usuário</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Data</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  Carregando…
                </td>
              </tr>
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  Nenhum ticket.
                </td>
              </tr>
            ) : (
              tickets.map((t) => (
                <tr
                  key={t.id}
                  className="cursor-pointer border-b border-fog last:border-0 hover:bg-mist/40"
                  onClick={() => openTicket(t)}
                >
                  <td className="px-4 py-3 font-medium text-navy">{t.subject}</td>
                  <td className="px-4 py-3 text-muted">
                    {t.user?.name ?? "—"}
                    <br />
                    <span className="text-xs">{t.user?.email}</span>
                  </td>
                  <td className="px-4 py-3">{STATUS_LABEL[t.status]}</td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(t.createdAt).toLocaleString("pt-BR")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-navy/40"
          onClick={() => setSelected(null)}
        >
          <div
            className="flex h-full w-full max-w-md flex-col bg-white shadow-xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Detalhe do ticket"
          >
            <div className="flex items-center justify-between border-b border-fog px-5 py-4">
              <h2 className="font-display text-lg font-semibold text-navy">
                Ticket
              </h2>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-sm text-muted hover:text-navy"
              >
                Fechar
              </button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              <div>
                <p className="text-xs font-medium uppercase text-muted">Assunto</p>
                <p className="mt-1 font-medium text-navy">{selected.subject}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted">Mensagem</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-ink">
                  {selected.message}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted">Usuário</p>
                <p className="mt-1 text-sm text-navy">
                  {selected.user?.name} · {selected.user?.email}
                </p>
                {selected.user?.email && (
                  <Link
                    href={`/dashboard/users?email=${encodeURIComponent(selected.user.email)}`}
                    className="mt-2 inline-block text-xs font-semibold text-brand hover:underline"
                  >
                    Banir / suspender este usuário
                  </Link>
                )}
              </div>

              <form onSubmit={handleSave} className="space-y-3 border-t border-fog pt-4">
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase text-muted">
                    Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) =>
                      setNewStatus(e.target.value as SupportTicketStatus)
                    }
                    className="w-full rounded-lg border border-fog px-3 py-2 text-sm outline-none focus:border-brand"
                  >
                    {(Object.keys(STATUS_LABEL) as SupportTicketStatus[]).map(
                      (s) => (
                        <option key={s} value={s}>
                          {STATUS_LABEL[s]}
                        </option>
                      ),
                    )}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase text-muted">
                    Resposta do admin
                  </label>
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    rows={5}
                    className="w-full rounded-lg border border-fog px-3 py-2 text-sm outline-none focus:border-brand"
                    placeholder="Escreva uma resposta…"
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-lg bg-navy py-2.5 text-sm font-semibold text-white hover:bg-brand disabled:opacity-60"
                >
                  {saving ? "Salvando…" : "Salvar"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
