"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import {
  api,
  formatPrice,
  itemStatusLabel,
  resolveImageUrl,
  type Item,
} from "@/lib/api";
import { useAuthRedirect } from "@/lib/auth";

type Purchase = {
  id: string;
  createdAt: string;
  item: Item;
};

function ComprasInner() {
  const { token, ready } = useAuthRedirect();
  const [purchases, setPurchases] = useState<Purchase[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!token) return;
    api
      .getMyPurchases(token)
      .then(setPurchases)
      .catch(() => setError(true));
  }, [token]);

  if (!ready || !token) return null;

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <Link
        href="/app"
        className="mb-4 inline-flex text-sm font-medium text-muted transition-soft hover:text-navy"
      >
        ← Voltar
      </Link>

      <h1 className="mb-1 font-[family-name:var(--font-display)] text-2xl font-bold text-navy">
        Minhas compras
      </h1>
      <p className="mb-6 text-sm text-muted">
        Anúncios em que você clicou em “Tenho interesse”.
      </p>

      {error && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Não foi possível carregar suas compras.
        </p>
      )}

      {purchases === null && !error && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-fog" />
          ))}
        </div>
      )}

      {purchases?.length === 0 && (
        <p className="rounded-xl border border-fog bg-white p-8 text-center text-sm text-muted">
          Você ainda não demonstrou interesse em nenhum anúncio. Explore o
          campus e clique em “Tenho interesse”.
        </p>
      )}

      {purchases && purchases.length > 0 && (
        <ul className="flex flex-col gap-3">
          {purchases.map((purchase) => {
            const status = itemStatusLabel(purchase.item);
            return (
              <li key={purchase.id}>
                <Link
                  href={`/itens/${purchase.item.id}`}
                  className="flex items-center gap-3 rounded-xl border border-fog bg-white p-3 transition-soft hover:border-brand hover:bg-mist/40"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-mist">
                    <Image
                      src={resolveImageUrl(purchase.item.imageUrl)}
                      alt={purchase.item.title}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-semibold text-navy">
                      {purchase.item.title}
                    </p>
                    <p className="text-xs text-muted">
                      de {purchase.item.user.name}
                    </p>
                    <p
                      className={`mt-0.5 text-sm font-bold ${
                        purchase.item.isDonation ? "text-brand" : "text-navy"
                      }`}
                    >
                      {formatPrice(purchase.item)}
                    </p>
                  </div>
                  {status && (
                    <span className="shrink-0 rounded-full bg-mist px-2.5 py-1 text-[11px] font-semibold text-navy/80">
                      {status}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function ComprasPage() {
  return (
    <Suspense>
      <ComprasInner />
    </Suspense>
  );
}
