"use client";

import type { AdminStats, AdminTrendPoint, Category } from "@/lib/api";
import { CATEGORIES } from "@/lib/api";

function maxOf(values: number[]) {
  return Math.max(1, ...values);
}

export function TrendLineChart({
  trends,
  title,
}: {
  trends: AdminTrendPoint[];
  title: string;
}) {
  const width = 560;
  const height = 180;
  const pad = { t: 16, r: 12, b: 28, l: 28 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const sales = trends.map((t) => t.sales);
  const donations = trends.map((t) => t.donations);
  const peak = maxOf([...sales, ...donations]);

  const toPoints = (values: number[]) =>
    values
      .map((v, i) => {
        const x = pad.l + (i / Math.max(1, values.length - 1)) * innerW;
        const y = pad.t + innerH - (v / peak) * innerH;
        return `${x},${y}`;
      })
      .join(" ");

  return (
    <div className="rounded-xl border border-fog bg-white p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-base font-semibold text-navy">{title}</h3>
        <div className="flex gap-3 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-brand" /> Vendas
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Doações
          </span>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full">
        {[0, 0.5, 1].map((t) => {
          const y = pad.t + innerH * (1 - t);
          return (
            <line
              key={t}
              x1={pad.l}
              x2={width - pad.r}
              y1={y}
              y2={y}
              stroke="#e5eaf2"
              strokeWidth="1"
            />
          );
        })}
        <polyline
          fill="none"
          stroke="#1a4fd6"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={toPoints(sales)}
        />
        <polyline
          fill="none"
          stroke="#10b981"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={toPoints(donations)}
        />
        <text x={pad.l} y={height - 8} className="fill-muted text-[10px]">
          30 dias
        </text>
        <text
          x={width - pad.r}
          y={height - 8}
          textAnchor="end"
          className="fill-muted text-[10px]"
        >
          hoje
        </text>
      </svg>
    </div>
  );
}

export function OrdersBarChart({
  ordersByStatus,
}: {
  ordersByStatus: NonNullable<AdminStats["ordersByStatus"]>;
}) {
  const rows = [
    { key: "PENDENTE", label: "Pendentes", value: ordersByStatus.PENDENTE, color: "#f59e0b" },
    { key: "NEGOCIANDO", label: "Negociando", value: ordersByStatus.NEGOCIANDO, color: "#1a4fd6" },
    { key: "ENTREGUE", label: "Entregues", value: ordersByStatus.ENTREGUE, color: "#10b981" },
  ];
  const peak = maxOf(rows.map((r) => r.value));

  return (
    <div className="rounded-xl border border-fog bg-white p-4 sm:p-5">
      <h3 className="mb-4 font-display text-base font-semibold text-navy">
        Pedidos por status
      </h3>
      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={row.key}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="font-medium text-navy">{row.label}</span>
              <span className="text-muted">{row.value}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-fog">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(row.value / peak) * 100}%`,
                  backgroundColor: row.color,
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CategoryBars({
  byCategory,
}: {
  byCategory: AdminStats["byCategory"];
}) {
  const maxCat = maxOf(byCategory.map((c) => c.count));
  return (
    <div className="rounded-xl border border-fog bg-white p-4 sm:p-5">
      <h3 className="mb-4 font-display text-base font-semibold text-navy">
        Anúncios ativos por categoria
      </h3>
      <ul className="space-y-3">
        {byCategory.map((row) => (
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
    </div>
  );
}

export function ActivityMiniBars({ trends }: { trends: AdminTrendPoint[] }) {
  const recent = trends.slice(-14);
  const peak = maxOf(recent.map((t) => t.newUsers + t.newItems));
  return (
    <div className="rounded-xl border border-fog bg-white p-4 sm:p-5">
      <h3 className="mb-1 font-display text-base font-semibold text-navy">
        Atividade (14 dias)
      </h3>
      <p className="mb-4 text-xs text-muted">
        Novos usuários + novos anúncios por dia
      </p>
      <div className="flex h-36 items-end gap-1.5">
        {recent.map((t) => {
          const total = t.newUsers + t.newItems;
          const h = Math.max(4, (total / peak) * 100);
          return (
            <div
              key={t.date}
              className="group relative flex flex-1 flex-col items-center justify-end"
              title={`${t.date}: ${t.newUsers} usuários, ${t.newItems} anúncios`}
            >
              <div
                className="w-full rounded-t bg-navy/80 transition-soft group-hover:bg-brand"
                style={{ height: `${h}%` }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
