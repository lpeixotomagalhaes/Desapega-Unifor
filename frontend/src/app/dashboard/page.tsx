"use client";

import { useEffect, useState } from "react";
import {
  api,
  CATEGORIES,
  type AdminStats,
  type Category,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function DashboardOverviewPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    api
      .getAdminStats(token)
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch(() => {
        if (!cancelled) setError("Não foi possível carregar as métricas.");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!stats) {
    return <p className="text-sm text-muted">Carregando visão geral…</p>;
  }

  const cards = [
    { label: "Usuários", value: stats.users },
    { label: "Anúncios ativos", value: stats.activeItems },
    { label: "Doações ativas", value: stats.donations },
    { label: "Negociando", value: stats.negotiating },
    { label: "Concluídos", value: stats.concluded },
    { label: "Tickets abertos", value: stats.openTickets },
    { label: "Contas suspensas", value: stats.suspendedUsers ?? 0 },
    { label: "Contas banidas", value: stats.bannedUsers ?? 0 },
  ];

  const maxCat = Math.max(1, ...stats.byCategory.map((c) => c.count));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy">Visão geral</h1>
        <p className="mt-1 text-sm text-muted">
          Métricas do marketplace Desapega UNIFOR.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-fog bg-white px-5 py-4"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              {card.label}
            </p>
            <p className="mt-1 font-display text-3xl font-bold text-navy">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <section>
        <h2 className="font-display text-lg font-semibold text-navy">
          Ativos por categoria
        </h2>
        <ul className="mt-4 space-y-3">
          {stats.byCategory.map((row) => (
            <li key={row.category}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-medium text-navy">
                  {CATEGORIES[row.category as Category]}
                </span>
                <span className="text-muted">{row.count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-fog">
                <div
                  className="h-full rounded-full bg-brand transition-all"
                  style={{ width: `${(row.count / maxCat) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
