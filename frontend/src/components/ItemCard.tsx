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
import { useSavedItems } from "@/lib/savedItems";

interface ItemCardProps {
  item: Item;
  onDelete?: (id: string) => void;
  deleting?: boolean;
}

export function ItemCard({ item, onDelete, deleting }: ItemCardProps) {
  const { user } = useAuth();
  const { isSaved, toggleSave } = useSavedItems();
  const statusLabel = itemStatusLabel(item);
  const isOwn = Boolean(user && user.id === item.user.id);
  const saved = isSaved(item.id);
  const canSave = !isOwn && item.status !== "CONCLUIDO";

  return (
    <article
      className={`group hover-lift relative flex flex-col overflow-hidden rounded-2xl border shadow-sm transition-[filter,opacity,background-color,border-color] duration-300 ${
        isOwn
          ? "border-fog/80 bg-slate-100/90 opacity-[0.88] grayscale-[45%] saturate-50"
          : "border-fog bg-white"
      }`}
    >
      <Link href={`/itens/${item.id}`} className="relative block h-44 w-full overflow-hidden bg-mist">
        <Image
          src={resolveImageUrl(item.imageUrl)}
          alt={item.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className={`object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04] ${
            item.status === "CONCLUIDO" || isOwn ? "grayscale-[30%]" : ""
          }`}
        />
        <span className="absolute left-3 top-3 max-w-[55%] truncate rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-navy shadow-sm">
          {formatCategories(item.categories)}
        </span>

        {canSave && (
          <button
            type="button"
            aria-label={saved ? "Remover dos salvos" : "Salvar interesse"}
            title={saved ? "Remover dos salvos" : "Salvar para negociar depois"}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void toggleSave(item.id);
            }}
            className={`absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full shadow-sm transition-soft ${
              saved
                ? "bg-brand text-white"
                : "bg-white/95 text-navy hover:bg-brand hover:text-white"
            }`}
          >
            <BookmarkIcon className="h-4 w-4" filled={saved} />
          </button>
        )}

        {isOwn ? (
          <span
            className={`absolute top-3 rounded-full bg-slate-600/90 px-3 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-sm ${
              canSave ? "right-14" : "right-3"
            }`}
          >
            Seu anúncio
          </span>
        ) : item.isDonation && item.status !== "CONCLUIDO" && !statusLabel && !canSave ? (
          <span className="absolute right-3 top-3 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white shadow-sm">
            Doação
          </span>
        ) : null}
        {!isOwn && statusLabel && (
          <span
            className={`absolute rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm ${
              canSave ? "right-14 top-3" : "right-3 top-3"
            } ${item.status === "CONCLUIDO" ? "bg-navy/80" : "bg-amber-500"}`}
          >
            {statusLabel}
          </span>
        )}
        {isOwn && statusLabel && (
          <span className="absolute bottom-3 left-3 rounded-full bg-slate-500/85 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
            {statusLabel}
          </span>
        )}
        {!isOwn && item.isDonation && item.status !== "CONCLUIDO" && canSave && (
          <span className="absolute bottom-3 left-3 rounded-full bg-brand px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
            Doação
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <Link href={`/itens/${item.id}`}>
          <h3
            className={`line-clamp-1 font-semibold hover:underline ${
              isOwn ? "text-navy/70" : "text-navy"
            }`}
          >
            {item.title}
          </h3>
        </Link>
        <p className="line-clamp-2 text-sm text-muted">{item.description}</p>

        <div className="mt-auto flex items-center justify-between pt-3">
          <Link
            href={`/itens/${item.id}`}
            className={`text-lg font-bold ${
              isOwn
                ? "text-navy/55"
                : item.isDonation
                  ? "text-brand"
                  : "text-navy"
            }`}
          >
            {formatPrice(item)}
          </Link>
          {isOwn ? (
            <span className="text-xs font-semibold text-slate-500">
              Seu item
            </span>
          ) : (
            <Link
              href={`/perfil/${item.user.id}`}
              className="text-xs text-muted/80 transition-soft hover:text-brand hover:underline"
            >
              {item.user.name}
            </Link>
          )}
        </div>
      </div>

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

function BookmarkIcon({
  className,
  filled,
}: {
  className?: string;
  filled?: boolean;
}) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 4.5h10a1 1 0 0 1 1 1V20l-6-3.5L6 20V5.5a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
        fill={filled ? "currentColor" : "none"}
      />
    </svg>
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
