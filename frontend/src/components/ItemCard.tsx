"use client";

import Image from "next/image";
import Link from "next/link";
import {
  formatCategories,
  formatPrice,
  itemStatusLabel,
  resolveImageUrl,
  type Item,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface ItemCardProps {
  item: Item;
  onDelete?: (id: string) => void;
  deleting?: boolean;
}

export function ItemCard({ item, onDelete, deleting }: ItemCardProps) {
  const { user } = useAuth();
  const statusLabel = itemStatusLabel(item);
  const isOwn = Boolean(user && user.id === item.user.id);

  return (
    <article className="group hover-lift relative flex flex-col overflow-hidden rounded-2xl border border-fog bg-white shadow-sm">
      <Link href={`/itens/${item.id}`} className="flex flex-1 flex-col">
        <div className="relative h-44 w-full overflow-hidden bg-mist">
          <Image
            src={resolveImageUrl(item.imageUrl)}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className={`object-cover transition-soft duration-500 group-hover:scale-110 ${
              item.status === "CONCLUIDO" ? "grayscale-[35%]" : ""
            }`}
          />
          <span className="absolute left-3 top-3 max-w-[70%] truncate rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-navy shadow-sm backdrop-blur">
            {formatCategories(item.categories)}
          </span>
          {item.isDonation && item.status !== "CONCLUIDO" && !statusLabel && (
            <span className="absolute right-3 top-3 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white shadow-sm">
              Doação
            </span>
          )}
          {statusLabel && (
            <span
              className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm ${
                item.status === "CONCLUIDO" ? "bg-navy/80" : "bg-amber-500"
              }`}
            >
              {statusLabel}
            </span>
          )}
          {isOwn && (
            <span className="absolute bottom-3 left-3 rounded-full bg-navy px-3 py-1 text-xs font-semibold text-white shadow-sm">
              Seu anúncio
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1 p-4">
          <h3 className="line-clamp-1 font-semibold text-navy">{item.title}</h3>
          <p className="line-clamp-2 text-sm text-muted">{item.description}</p>

          <div className="mt-auto flex items-center justify-between pt-3">
            <span
              className={`text-lg font-bold ${item.isDonation ? "text-brand" : "text-navy"}`}
            >
              {formatPrice(item)}
            </span>
            <span className="text-xs text-muted/80">
              {isOwn ? "Você" : item.user.name}
            </span>
          </div>
        </div>
      </Link>

      {onDelete && (
        <div className="px-4 pb-4">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(item.id);
            }}
            disabled={deleting}
            className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition-soft hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? "Removendo..." : "Remover anúncio"}
          </button>
        </div>
      )}
    </article>
  );
}

export function ItemCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-fog bg-white">
      <div className="h-44 bg-fog" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-3/4 rounded bg-fog" />
        <div className="h-3 w-full rounded bg-mist" />
        <div className="h-3 w-2/3 rounded bg-mist" />
        <div className="h-5 w-20 rounded bg-fog" />
      </div>
    </div>
  );
}
