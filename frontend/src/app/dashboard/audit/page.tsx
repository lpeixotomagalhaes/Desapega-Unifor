"use client";

import { useEffect, useState } from "react";
import { api, type AuditLogEntry } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const ACTION_LABEL: Record<string, string> = {
  USER_BAN: "Banimento",
  USER_SUSPEND: "Suspensão",
  USER_RESTORE: "Reativação",
  ITEM_TAKE_DOWN: "Remoção de anúncio",
  SUPPORT_UPDATE: "Suporte",
  ADMIN_PROMOTE: "Promoção a admin",
  ADMIN_REVOKE: "Revogação de admin",
};

export default function DashboardAuditPage() {
  const { token } = useAuth();
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [action, setAction] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    api
      .getAdminAuditLogs(token, {
        limit: 60,
        action: action || undefined,
      })
      .then((data) => {
        if (cancelled) return;
        setEntries(data.entries);
        setTotal(data.total);
        setError(null);
      })
      .catch(() => {
        if (!cancelled) setError("Não foi possível carregar a auditoria.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, action]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy">Auditoria</h1>
        <p className="mt-1 text-sm text-muted">
          Registro de ações administrativas ({total} eventos).
        </p>
      </div>

      <select
        value={action}
        onChange={(e) => setAction(e.target.value)}
        className="rounded-lg border border-fog bg-white px-3 py-2 text-sm outline-none focus:border-brand"
      >
        <option value="">Todas as ações</option>
        {Object.entries(ACTION_LABEL).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-xl border border-fog bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-fog bg-mist/50 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Quando</th>
              <th className="px-4 py-3 font-medium">Ação</th>
              <th className="px-4 py-3 font-medium">Resumo</th>
              <th className="px-4 py-3 font-medium">Autor</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  Carregando…
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  Nenhum evento registrado ainda.
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id} className="border-b border-fog last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 text-muted">
                    {new Date(entry.createdAt).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-mist px-2 py-0.5 text-xs font-semibold text-navy">
                      {ACTION_LABEL[entry.action] ?? entry.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-navy">{entry.summary}</td>
                  <td className="px-4 py-3 text-muted">
                    {entry.actor ? (
                      <span title={entry.actor.email}>{entry.actor.name}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
