"use client";

import { useEffect, useState } from "react";
import {
  ActivityMiniBars,
  CategoryBars,
  OrdersBarChart,
  TrendLineChart,
} from "@/components/AdminCharts";
import { api, type AdminStats } from "@/lib/api";
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
    { label: "Vendas concluídas", value: stats.salesTotal ?? 0 },
    { label: "Doações concluídas", value: stats.donationsConcluded ?? 0 },
    { label: "Tickets abertos", value: stats.openTickets },
    { label: "Contas suspensas", value: stats.suspendedUsers ?? 0 },
    { label: "Contas banidas", value: stats.bannedUsers ?? 0 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy">Visão geral</h1>
        <p className="mt-1 text-sm text-muted">
          Métricas e evolução do marketplace Desapega UNIFOR.
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

      {stats.trends && stats.trends.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          <TrendLineChart
            trends={stats.trends}
            title="Vendas e doações (30 dias)"
          />
          <ActivityMiniBars trends={stats.trends} />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {stats.ordersByStatus && (
          <OrdersBarChart ordersByStatus={stats.ordersByStatus} />
        )}
        <CategoryBars byCategory={stats.byCategory} />
      </div>
    </div>
  );
}
