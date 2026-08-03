"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { InterestOrderForm } from "@/components/InterestOrderForm";
import { ItemComments } from "@/components/ItemComments";
import {
  api,
  CATEGORIES,
  formatCategories,
  formatPrice,
  itemGalleryUrls,
  itemStatusLabel,
  resolveImageUrl,
  type Item,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function ItemDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const [item, setItem] = useState<Item | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const id = params.id;

  useEffect(() => {
    let cancelled = false;
    setItem(null);
    setNotFound(false);
    setActiveImage(0);
    api
      .getItem(id)
      .then((data) => {
        if (!cancelled) setItem(data);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (notFound) {
    return (
      <div className="mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-navy">Anúncio não encontrado</h1>
        <p className="text-muted">
          Esse item pode ter sido removido ou já foi concluído.
        </p>
        <Link
          href="/app"
          className="rounded-xl bg-navy px-6 py-2.5 font-semibold text-white transition-soft hover:bg-brand"
        >
          Voltar para o app
        </Link>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <div className="grid animate-pulse gap-8 md:grid-cols-2">
          <div className="h-72 rounded-2xl bg-fog sm:h-96" />
          <div className="space-y-3">
            <div className="h-7 w-2/3 rounded bg-fog" />
            <div className="h-4 w-1/3 rounded bg-mist" />
            <div className="h-9 w-1/2 rounded bg-fog" />
            <div className="h-24 rounded bg-mist" />
          </div>
        </div>
      </div>
    );
  }

  const isConcluded = item.status === "CONCLUIDO";
  const statusLabel = itemStatusLabel(item);
  const gallery = itemGalleryUrls(item);
  const currentSrc = gallery[Math.min(activeImage, gallery.length - 1)] ?? item.imageUrl;

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:py-8">
      <Link
        href="/app"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-soft hover:text-navy"
      >
        ← Voltar
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <div className="relative h-72 w-full overflow-hidden rounded-2xl bg-mist sm:h-96">
            <Image
              src={resolveImageUrl(currentSrc)}
              alt={item.title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className={`object-cover ${isConcluded ? "grayscale-[35%]" : ""}`}
              priority
            />
            <span className="absolute left-4 top-4 max-w-[70%] truncate rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-navy shadow-sm backdrop-blur">
              {formatCategories(item.categories)}
            </span>
            {statusLabel && (
              <span
                className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm ${
                  isConcluded ? "bg-navy/80" : "bg-amber-500"
                }`}
              >
                {statusLabel}
              </span>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {gallery.map((url, i) => (
                <button
                  key={`${url}-${i}`}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-soft ${
                    i === activeImage
                      ? "border-brand"
                      : "border-transparent opacity-80 hover:opacity-100"
                  }`}
                  aria-label={`Ver foto ${i + 1}`}
                >
                  <Image
                    src={resolveImageUrl(url)}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-navy">
              {item.title}
            </h1>
            <p className="mt-1 text-sm text-muted">
              Anunciado por{" "}
              <Link
                href={`/perfil/${item.user.id}`}
                className="font-medium text-navy transition-soft hover:text-brand hover:underline"
              >
                {item.user.name}
              </Link>
              {user?.id === item.user.id ? " (você)" : ""}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(item.categories ?? []).map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-fog bg-mist px-2.5 py-0.5 text-xs font-semibold text-navy/80"
                >
                  {CATEGORIES[c]}
                </span>
              ))}
            </div>
          </div>

          <p
            className={`text-3xl font-extrabold ${item.isDonation ? "text-brand" : "text-navy"}`}
          >
            {formatPrice(item)}
          </p>

          <div>
            <h2 className="mb-1 text-sm font-semibold text-navy">Descrição</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted">
              {item.description}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-2">
        <ItemComments itemId={item.id} />
        <div className="min-w-0">
          <InterestOrderForm item={item} />
        </div>
      </div>
    </div>
  );
}
