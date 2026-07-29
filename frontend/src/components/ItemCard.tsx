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
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-soft hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative h-44 w-full overflow-hidden bg-stone-100">
        <Image
          src={item.imageUrl}
          alt={item.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-soft group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-stone-700 backdrop-blur">
          {CATEGORIES[item.category]}
        </span>
        {item.isDonation && (
          <span className="absolute right-3 top-3 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
            Doação
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="line-clamp-1 font-semibold text-stone-900">
          {item.title}
        </h3>
        <p className="line-clamp-2 text-sm text-stone-500">
          {item.description}
        </p>

        <div className="mt-auto flex items-center justify-between pt-3">
          <span
            className={`text-lg font-bold ${item.isDonation ? "text-emerald-600" : "text-stone-900"}`}
          >
            {formatPrice(item)}
          </span>
          <span className="text-xs text-stone-400">{item.user.name}</span>
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
    <div className="animate-pulse overflow-hidden rounded-2xl border border-stone-200 bg-white">
      <div className="h-44 bg-stone-200" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-3/4 rounded bg-stone-200" />
        <div className="h-3 w-full rounded bg-stone-100" />
        <div className="h-3 w-2/3 rounded bg-stone-100" />
        <div className="h-5 w-20 rounded bg-stone-200" />
      </div>
    </div>
  );
}
