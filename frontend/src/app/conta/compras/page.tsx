"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { RatingModal } from "@/components/RatingModal";
import {
  api,
  formatPrice,
  resolveImageUrl,
  type Item,
  type OrderStatus,
  type PendingReviewOrder,
} from "@/lib/api";
import { useAuthRedirect } from "@/lib/auth";

type Purchase = {
  id: string;
  createdAt: string;
  status: OrderStatus;
  course?: string;
  meetupDay?: string;
  meetupTime?: string;
  campusBlock?: string;
  item: Item;
  review: { id: string; rating: number } | null;
};

const ORDER_LABEL: Record<OrderStatus, string> = {
  PENDENTE: "Pedido pendente",
  NEGOCIANDO: "Em negociação",
  ENTREGUE: "Entregue",
};

function ComprasInner() {
  const { token, ready } = useAuthRedirect();
  const [purchases, setPurchases] = useState<Purchase[] | null>(null);
  const [error, setError] = useState(false);
  const [ratingOrder, setRatingOrder] = useState<PendingReviewOrder | null>(
    null,
  );

  const load = () => {
    if (!token) return;
    api
      .getMyPurchases(token)
      .then(setPurchases)
      .catch(() => setError(true));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        Meus pedidos
      </h1>
      <p className="mb-6 text-sm text-muted">
        Pedidos enviados e avaliações após a entrega.
      </p>

      {error && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Não foi possível carregar seus pedidos.
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
          Você ainda não enviou nenhum pedido. Abra um anúncio e preencha o
          formulário.
        </p>
      )}

      {purchases && purchases.length > 0 && (
        <ul className="flex flex-col gap-3">
          {purchases.map((purchase) => {
            const canRate =
              purchase.status === "ENTREGUE" && !purchase.review;
            return (
              <li
                key={purchase.id}
                className="rounded-xl border border-fog bg-white p-3"
              >
                <div className="flex items-center gap-3">
                  <Link
                    href={`/itens/${purchase.item.id}`}
                    className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-mist"
                  >
                    <Image
                      src={resolveImageUrl(purchase.item.imageUrl)}
                      alt={purchase.item.title}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/itens/${purchase.item.id}`}
                      className="line-clamp-1 text-sm font-semibold text-navy hover:underline"
                    >
                      {purchase.item.title}
                    </Link>
                    <p className="text-xs text-muted">
                      de{" "}
                      <Link
                        href={`/perfil/${purchase.item.user.id}`}
                        className="font-medium hover:text-brand hover:underline"
                      >
                        {purchase.item.user.name}
                      </Link>
                    </p>
                    <p
                      className={`mt-0.5 text-sm font-bold ${
                        purchase.item.isDonation ? "text-brand" : "text-navy"
                      }`}
                    >
                      {formatPrice(purchase.item)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-mist px-2.5 py-1 text-[11px] font-semibold text-navy/80">
                    {ORDER_LABEL[purchase.status] ?? purchase.status}
                  </span>
                </div>
                {canRate && (
                  <button
                    type="button"
                    onClick={() =>
                      setRatingOrder({
                        id: purchase.id,
                        itemId: purchase.item.id,
                        status: purchase.status,
                        item: {
                          id: purchase.item.id,
                          title: purchase.item.title,
                          imageUrl: purchase.item.imageUrl,
                          user: {
                            id: purchase.item.user.id,
                            name: purchase.item.user.name,
                            avatarUrl: null,
                          },
                        },
                      })
                    }
                    className="mt-3 w-full rounded-lg bg-navy py-2 text-sm font-semibold text-white hover:bg-brand"
                  >
                    Avaliar vendedor
                  </button>
                )}
                {purchase.review && (
                  <p className="mt-2 text-xs font-medium text-amber-700">
                    Você avaliou com {purchase.review.rating} estrela
                    {purchase.review.rating === 1 ? "" : "s"}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {ratingOrder && (
        <RatingModal
          order={ratingOrder}
          onClose={() => setRatingOrder(null)}
          onSubmitted={() => {
            setRatingOrder(null);
            load();
          }}
        />
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
