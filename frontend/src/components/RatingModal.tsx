"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { api, ApiError, resolveImageUrl, type PendingReviewOrder } from "@/lib/api";
import { useAuth } from "@/lib/auth";

function StarButton({
  filled,
  onSelect,
  label,
}: {
  filled: boolean;
  onSelect: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={label}
      className={`transition-transform duration-150 hover:scale-110 ${
        filled ? "text-amber-400" : "text-fog"
      }`}
    >
      <svg className="h-9 w-9" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 2.5l2.9 6.1 6.7.9-4.9 4.6 1.2 6.6L12 17.5 6.1 20.7l1.2-6.6L2.4 9.5l6.7-.9L12 2.5z" />
      </svg>
    </button>
  );
}

export function StarRatingDisplay({
  value,
  size = "md",
}: {
  value: number;
  size?: "sm" | "md";
}) {
  const cls = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} de 5 estrelas`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          className={`${cls} ${i < Math.round(value) ? "text-amber-400" : "text-fog"}`}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden
        >
          <path d="M12 2.5l2.9 6.1 6.7.9-4.9 4.6 1.2 6.6L12 17.5 6.1 20.7l1.2-6.6L2.4 9.5l6.7-.9L12 2.5z" />
        </svg>
      ))}
    </span>
  );
}

export function RatingModal({
  order,
  onClose,
  onSubmitted,
}: {
  order: PendingReviewOrder;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const { token } = useAuth();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (rating < 1) {
      setError("Escolha de 1 a 5 estrelas.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.createReview(token, {
        orderId: order.id,
        rating,
        comment: comment.trim() || undefined,
      });
      onSubmitted();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Não foi possível enviar a avaliação.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const display = hover || rating;
  const seller = order.item.user;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-navy/45 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rating-modal-title"
        className="w-full max-w-md rounded-2xl border border-fog bg-white p-6 shadow-xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start gap-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-mist">
            <Image
              src={resolveImageUrl(order.item.imageUrl)}
              alt=""
              fill
              sizes="56px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h2
              id="rating-modal-title"
              className="font-display text-lg font-bold text-navy"
            >
              Avalie o vendedor
            </h2>
            <p className="text-sm text-muted">
              {seller.name} · {order.item.title}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div
            className="flex justify-center gap-1"
            onMouseLeave={() => setHover(0)}
          >
            {Array.from({ length: 5 }, (_, i) => {
              const value = i + 1;
              return (
                <span
                  key={value}
                  onMouseEnter={() => setHover(value)}
                >
                  <StarButton
                    filled={value <= display}
                    onSelect={() => setRating(value)}
                    label={`${value} estrela${value > 1 ? "s" : ""}`}
                  />
                </span>
              );
            })}
          </div>

          <label className="block text-sm font-medium text-navy">
            Comentário{" "}
            <span className="font-normal text-muted">(opcional)</span>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Como foi o encontro e a negociação?"
              className="mt-1.5 w-full rounded-xl border border-fog px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
            />
          </label>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-fog py-2.5 text-sm font-semibold text-navy hover:bg-mist"
            >
              Agora não
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-navy py-2.5 text-sm font-semibold text-white hover:bg-brand disabled:opacity-60"
            >
              {submitting ? "Enviando…" : "Enviar avaliação"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
