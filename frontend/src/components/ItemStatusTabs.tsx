"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ItemCard, ItemCardSkeleton } from "@/components/ItemCard";
import {
  api,
  ApiError,
  resolveImageUrl,
  type Item,
  type ItemInterest,
  type ItemStatus,
} from "@/lib/api";

export type MyAdsTabId = "publicados" | "negociando" | "concluidos" | "interessados";
type TabId = MyAdsTabId;

const TABS: { id: TabId; label: string }[] = [
  { id: "publicados", label: "Publicados" },
  { id: "negociando", label: "Em negociação" },
  { id: "concluidos", label: "Vendidos e doados" },
  { id: "interessados", label: "Pedidos" },
];

const EMPTY_MESSAGES: Record<Exclude<TabId, "interessados">, string> = {
  publicados: "Nenhum anúncio publicado no momento. Use a aba “Anunciar” para começar.",
  negociando: "Nenhum anúncio em negociação agora.",
  concluidos: "Nenhum anúncio concluído ainda.",
};

interface ItemStatusTabsProps {
  items: Item[] | null;
  interests: ItemInterest[] | null;
  token: string | null;
  deletingId: string | null;
  initialTab?: TabId;
  onDeleteItem: (id: string) => void;
  onItemUpdated: (item: Item) => void;
  onInterestUpdated?: (interest: ItemInterest) => void;
}

function parseInitialTab(value: string | undefined): TabId {
  if (
    value === "publicados" ||
    value === "negociando" ||
    value === "concluidos" ||
    value === "interessados"
  ) {
    return value;
  }
  return "publicados";
}

export function ItemStatusTabs({
  items,
  interests,
  token,
  deletingId,
  initialTab,
  onDeleteItem,
  onItemUpdated,
  onInterestUpdated,
}: ItemStatusTabsProps) {
  const [tab, setTab] = useState<TabId>(() => parseInitialTab(initialTab));
  const [actingKey, setActingKey] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTab) setTab(parseInitialTab(initialTab));
  }, [initialTab]);

  const grouped = useMemo(() => {
    const all = items ?? [];
    return {
      publicados: all.filter((i) => i.status === "ATIVO"),
      negociando: all.filter((i) => i.status === "NEGOCIANDO"),
      concluidos: all.filter((i) => i.status === "CONCLUIDO"),
    };
  }, [items]);

  const counts: Record<TabId, number | null> = {
    publicados: items ? grouped.publicados.length : null,
    negociando: items ? grouped.negociando.length : null,
    concluidos: items ? grouped.concluidos.length : null,
    interessados: interests ? interests.length : null,
  };

  const changeStatus = async (
    itemId: string,
    status: ItemStatus,
    negotiatingWithId?: string | null,
  ) => {
    if (!token) return;
    const key = `${itemId}:${status}:${negotiatingWithId ?? ""}`;
    setActingKey(key);
    setActionError(null);
    try {
      const updated = await api.updateItemStatus(token, itemId, {
        status,
        negotiatingWithId,
      });
      onItemUpdated(updated);
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? err.message
          : "Não foi possível atualizar o anúncio.",
      );
    } finally {
      setActingKey(null);
    }
  };

  const changeOrderStatus = async (
    orderId: string,
    status: "NEGOCIANDO" | "ENTREGUE",
  ) => {
    if (!token) return;
    const key = `order:${orderId}:${status}`;
    setActingKey(key);
    setActionError(null);
    try {
      const updated = await api.updateOrderStatus(token, orderId, status);
      onInterestUpdated?.(updated);
      // Atualiza o card do anúncio após mudança de status do pedido.
      const refreshed = await api.getMyItems(token);
      const match = refreshed.find((i) => i.id === updated.itemId);
      if (match) onItemUpdated(match);
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? err.message
          : "Não foi possível atualizar o pedido.",
      );
    } finally {
      setActingKey(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-soft ${
              tab === t.id
                ? "bg-navy text-white"
                : "border border-fog bg-white text-muted"
            }`}
          >
            {t.label}
            {counts[t.id] !== null && counts[t.id]! > 0 && (
              <span
                className={`ml-1.5 ${tab === t.id ? "text-white/75" : "text-muted/70"}`}
              >
                ({counts[t.id]})
              </span>
            )}
          </button>
        ))}
      </div>

      {actionError && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </p>
      )}

      {tab !== "interessados" ? (
        <ItemsPanel
          items={items === null ? null : grouped[tab]}
          emptyMessage={EMPTY_MESSAGES[tab]}
          deletingId={deletingId}
          onDeleteItem={onDeleteItem}
          renderActions={(item) => (
            <StatusActions
              item={item}
              acting={actingKey?.startsWith(item.id)}
              onChangeStatus={changeStatus}
            />
          )}
        />
      ) : (
        <InterestsPanel
          interests={interests}
          actingKey={actingKey}
          onConfirmNegotiation={(orderId) =>
            void changeOrderStatus(orderId, "NEGOCIANDO")
          }
          onConfirmDelivery={(orderId) =>
            void changeOrderStatus(orderId, "ENTREGUE")
          }
        />
      )}
    </div>
  );
}

function ItemsPanel({
  items,
  emptyMessage,
  deletingId,
  onDeleteItem,
  renderActions,
}: {
  items: Item[] | null;
  emptyMessage: string;
  deletingId: string | null;
  onDeleteItem: (id: string) => void;
  renderActions: (item: Item) => React.ReactNode;
}) {
  if (items === null) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <ItemCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-fog bg-white p-8 text-center text-sm text-muted">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div key={item.id} className="flex flex-col gap-2">
          <ItemCard
            item={item}
            onDelete={onDeleteItem}
            deleting={deletingId === item.id}
          />
          {renderActions(item)}
        </div>
      ))}
    </div>
  );
}

function StatusActions({
  item,
  acting,
  onChangeStatus,
}: {
  item: Item;
  acting?: boolean;
  onChangeStatus: (itemId: string, status: ItemStatus) => void;
}) {
  const btnClass =
    "flex-1 rounded-lg border border-fog px-3 py-2 text-xs font-semibold text-navy/80 transition-soft hover:border-brand hover:text-brand disabled:opacity-50";

  if (item.status === "ATIVO") {
    return (
      <button
        type="button"
        disabled={acting}
        onClick={() => onChangeStatus(item.id, "CONCLUIDO")}
        className={btnClass}
      >
        Marcar como {item.isDonation ? "doado" : "vendido"}
      </button>
    );
  }

  if (item.status === "NEGOCIANDO") {
    return (
      <div className="flex gap-2">
        <button
          type="button"
          disabled={acting}
          onClick={() => onChangeStatus(item.id, "CONCLUIDO")}
          className={btnClass}
        >
          Concluir
        </button>
        <button
          type="button"
          disabled={acting}
          onClick={() => onChangeStatus(item.id, "ATIVO")}
          className={btnClass}
        >
          Reabrir
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={acting}
      onClick={() => onChangeStatus(item.id, "ATIVO")}
      className={btnClass}
    >
      Reabrir anúncio
    </button>
  );
}

const ORDER_STATUS_LABEL: Record<ItemInterest["status"], string> = {
  PENDENTE: "Pendente",
  NEGOCIANDO: "Em negociação",
  ENTREGUE: "Entregue",
};

function formatOrderValue(order: ItemInterest): string {
  if (order.item.isDonation) return "Doação";
  if (order.acceptListedPrice) {
    if (order.item.price == null) return "Valor anunciado";
    return Number(order.item.price).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }
  if (order.offeredPrice == null) return "Oferta a combinar";
  return Number(order.offeredPrice).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function InterestsPanel({
  interests,
  actingKey,
  onConfirmNegotiation,
  onConfirmDelivery,
}: {
  interests: ItemInterest[] | null;
  actingKey: string | null;
  onConfirmNegotiation: (orderId: string) => void;
  onConfirmDelivery: (orderId: string) => void;
}) {
  if (interests === null) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-fog" />
        ))}
      </div>
    );
  }

  if (interests.length === 0) {
    return (
      <p className="rounded-xl border border-fog bg-white p-8 text-center text-sm text-muted">
        Nenhum pedido nos seus anúncios ainda.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {interests.map((interest) => {
        const negotiatingKey = `order:${interest.id}:NEGOCIANDO`;
        const deliveryKey = `order:${interest.id}:ENTREGUE`;
        const acting =
          actingKey === negotiatingKey || actingKey === deliveryKey;
        return (
          <li
            key={interest.id}
            className="rounded-xl border border-fog bg-white p-3 sm:p-4"
          >
            <div className="flex gap-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-mist">
                <Image
                  src={resolveImageUrl(interest.item.imageUrl)}
                  alt={interest.item.title}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <Link
                      href={`/itens/${interest.item.id}`}
                      className="line-clamp-1 text-sm font-semibold text-navy hover:underline"
                    >
                      {interest.item.title}
                    </Link>
                    <p className="text-xs text-muted">
                      Pedido de{" "}
                      <span className="font-medium">{interest.buyer.name}</span>
                    </p>
                  </div>
                  <span className="rounded-full bg-mist px-2.5 py-1 text-[11px] font-semibold text-navy/80">
                    {ORDER_STATUS_LABEL[interest.status] ?? interest.status}
                  </span>
                </div>
                <dl className="mt-2 grid gap-1 text-xs text-muted sm:grid-cols-2">
                  <div>
                    <dt className="inline font-medium text-navy/70">Curso: </dt>
                    <dd className="inline">{interest.course || "—"}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-navy/70">
                      Matrícula:{" "}
                    </dt>
                    <dd className="inline">{interest.enrollment || "—"}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-navy/70">Valor: </dt>
                    <dd className="inline">{formatOrderValue(interest)}</dd>
                  </div>
                  <div>
                    <dt className="inline font-medium text-navy/70">
                      Encontro:{" "}
                    </dt>
                    <dd className="inline">
                      {interest.meetupDay || "—"} às {interest.meetupTime || "—"}{" "}
                      — {interest.campusBlock || "—"}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap justify-end gap-2">
              {interest.status === "PENDENTE" && (
                <button
                  type="button"
                  disabled={acting}
                  onClick={() => onConfirmNegotiation(interest.id)}
                  className="rounded-lg bg-navy px-3 py-2 text-xs font-semibold text-white transition-soft hover:bg-brand disabled:opacity-50"
                >
                  Confirmar negociação
                </button>
              )}
              {interest.status === "NEGOCIANDO" && (
                <button
                  type="button"
                  disabled={acting}
                  onClick={() => onConfirmDelivery(interest.id)}
                  className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white transition-soft hover:bg-green-700 disabled:opacity-50"
                >
                  Confirmar entrega
                </button>
              )}
              {interest.status === "ENTREGUE" && (
                <span className="text-xs font-medium text-green-700">
                  Entrega confirmada
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
