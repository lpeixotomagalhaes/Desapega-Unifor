"use client";

import Image from "next/image";
import { CATEGORIES, formatPrice, type Item } from "@/lib/api";

interface ItemCardProps {
  item: Item;
  onDelete?: (id: string) => void;
  deleting?: boolean;
}

export function ItemCard({ item, onDelete, deleting }: ItemCardProps) {
  return (
    <article className="group hover-lift flex flex-col overflow-hidden rounded-2xl border border-fog bg-white shadow-sm">
      <div className="relative h-44 w-full overflow-hidden bg-mist">
        <Image
          src={item.imageUrl}
          alt={item.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-soft duration-500 group-hover:scale-110"
        />
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-navy shadow-sm backdrop-blur">
          {CATEGORIES[item.category]}
        </span>
        {item.isDonation && (
          <span className="absolute right-3 top-3 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white shadow-sm">
            Doação
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
          <span className="text-xs text-muted/80">{item.user.name}</span>
        </div>

        {onDelete && (
          <button
            onClick={() => onDelete(item.id)}
            disabled={deleting}
            className="mt-3 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition-soft hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? "Removendo..." : "Remover anúncio"}
          </button>
        )}
      </div>
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
