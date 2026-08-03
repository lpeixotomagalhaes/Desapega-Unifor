"use client";

import { useEffect, useState } from "react";
import {
  ActivityMiniBars,
  CategoryBars,
  OrdersBarChart,
  TrendLineChart,
} from "@/components/AdminCharts";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { api, type AdminStats } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const STATS_CACHE_KEY = "desapega.dashboardStats";

type CachedStats = {
  stats: AdminStats;
  cachedAt: number;
};

function loadCachedStats(): CachedStats | null {
  try {
    const raw = localStorage.getItem(STATS_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CachedStats;
  } catch {
    return null;
  }
}

function saveCachedStats(stats: AdminStats) {
  try {
    const payload: CachedStats = { stats, cachedAt: Date.now() };
    localStorage.setItem(STATS_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // storage full / unavailable
  }
}

function formatCachedAt(ts: number): string {
  try {
    return new Date(ts).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function DashboardOverviewPage() {
  const { token } = useAuth();
  const isOnline = useOnlineStatus();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [cachedAt, setCachedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    api
      .getAdminStats(token)
      .then((data) => {
        if (cancelled) return;
        setStats(data);
        setCachedAt(null);
        setError(null);
        saveCachedStats(data);
      })
      .catch(() => {
        if (cancelled) return;
        const cached = loadCachedStats();
        if (cached && !navigator.onLine) {
          setStats(cached.stats);
          setCachedAt(cached.cachedAt);
          setError(null);
        } else if (cached && !isOnline) {
          setStats(cached.stats);
          setCachedAt(cached.cachedAt);
          setError(null);
        } else {
          setError("Não foi possível carregar as métricas.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token, isOnline]);

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
        {cachedAt !== null && (
          <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Dados de {formatCachedAt(cachedAt)} (offline)
          </p>
        )}
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
