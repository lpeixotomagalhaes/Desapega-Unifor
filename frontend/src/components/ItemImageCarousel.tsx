"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { itemGalleryUrls, resolveImageUrl, type Item } from "@/lib/api";

type ItemImageCarouselProps = {
  item: Pick<Item, "imageUrl" | "imageUrls" | "title">;
  className?: string;
  /** Altura do container (classes Tailwind). */
  heightClass?: string;
  sizes?: string;
  priority?: boolean;
  overlayTopLeft?: ReactNode;
  overlayTopRight?: ReactNode;
  overlayBottomLeft?: ReactNode;
  /** Se false, só mostra capa sem controles. */
  enableNav?: boolean;
  roundedClass?: string;
  imageClassName?: string;
};

export function ItemImageCarousel({
  item,
  className = "",
  heightClass = "h-44",
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw",
  priority,
  overlayTopLeft,
  overlayTopRight,
  overlayBottomLeft,
  enableNav = true,
  roundedClass = "",
  imageClassName = "",
}: ItemImageCarouselProps) {
  const gallery = itemGalleryUrls(item);
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const count = gallery.length;
  const safeIndex = count === 0 ? 0 : ((index % count) + count) % count;
  const src = gallery[safeIndex] ?? item.imageUrl;

  useEffect(() => {
    setIndex(0);
  }, [item.imageUrl, item.imageUrls]);

  const go = useCallback(
    (delta: number) => {
      if (count <= 1) return;
      setIndex((i) => (i + delta + count) % count);
    },
    [count],
  );

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0]?.clientX ?? null;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null || count <= 1) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const dx = endX - touchStartX.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    touchStartX.current = null;
  };

  return (
    <div
      className={`relative w-full overflow-hidden bg-mist ${heightClass} ${roundedClass} ${className}`}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <Image
        src={resolveImageUrl(src)}
        alt={item.title}
        fill
        sizes={sizes}
        priority={priority}
        className={`object-cover ${imageClassName}`}
      />

      {overlayTopLeft}
      {overlayTopRight}
      {overlayBottomLeft}

      {enableNav && count > 1 && (
        <>
          <button
            type="button"
            aria-label="Foto anterior"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              go(-1);
            }}
            className="absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-navy shadow-sm transition-soft hover:bg-white"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Próxima foto"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              go(1);
            }}
            className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-navy shadow-sm transition-soft hover:bg-white"
          >
            ›
          </button>
          <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
            {gallery.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Ir para foto ${i + 1}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIndex(i);
                }}
                className={`h-1.5 rounded-full transition-soft ${
                  i === safeIndex ? "w-4 bg-white" : "w-1.5 bg-white/55"
                }`}
              />
            ))}
          </div>
          <span className="absolute bottom-2 right-2 z-10 rounded-full bg-navy/70 px-2 py-0.5 text-[10px] font-semibold text-white">
            {safeIndex + 1}/{count}
          </span>
        </>
      )}
    </div>
  );
}
