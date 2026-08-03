"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  api,
  ApiError,
  resolveImageUrl,
  type ItemComment,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";

function CommentAvatar({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl: string | null;
}) {
  const initial = (name.trim()[0] ?? "?").toUpperCase();
  if (avatarUrl) {
    return (
      <Image
        src={resolveImageUrl(avatarUrl)}
        alt=""
        width={40}
        height={40}
        className="h-10 w-10 rounded-full object-cover"
      />
    );
  }
  return (
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">
      {initial}
    </span>
  );
}

export function ItemComments({ itemId }: { itemId: string }) {
  const { user, token } = useAuth();
  const [comments, setComments] = useState<ItemComment[] | null>(null);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setComments(null);
    api
      .getItemComments(itemId)
      .then((data) => {
        if (!cancelled) setComments(data);
      })
      .catch(() => {
        if (!cancelled) setComments([]);
      });
    return () => {
      cancelled = true;
    };
  }, [itemId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      window.location.href = `/login?returnUrl=${encodeURIComponent(`/itens/${itemId}`)}`;
      return;
    }
    const text = body.trim();
    if (text.length < 2) {
      setError("Escreva uma pergunta com pelo menos 2 caracteres.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const created = await api.createItemComment(token, itemId, text);
      setComments((prev) => [...(prev ?? []), created]);
      setBody("");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Não foi possível enviar o comentário.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="flex h-full flex-col rounded-2xl border border-fog bg-white p-4 sm:p-5">
      <div className="mb-3">
        <h2 className="font-display text-lg font-bold text-navy">
          Tire suas dúvidas
        </h2>
        <p className="text-sm text-muted">
          Pergunte ao anunciante sobre estado, retirada ou detalhes do item.
        </p>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {comments === null ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-mist" />
            ))}
          </div>
        ) : comments.length === 0 ? (
          <p className="rounded-xl border border-dashed border-fog bg-mist/40 px-4 py-8 text-center text-sm text-muted">
            Nenhuma pergunta ainda. Seja o primeiro a comentar.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {comments.map((c) => (
              <li
                key={c.id}
                className="flex gap-3 rounded-xl border border-fog bg-mist/30 p-3"
              >
                <Link href={`/perfil/${c.user.id}`} className="shrink-0">
                  <CommentAvatar
                    name={c.user.name}
                    avatarUrl={c.user.avatarUrl}
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <Link
                      href={`/perfil/${c.user.id}`}
                      className="text-sm font-semibold text-navy hover:underline"
                    >
                      {c.user.name}
                    </Link>
                    <span className="text-[11px] text-muted">
                      {new Date(c.createdAt).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-navy/80">
                    {c.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 border-t border-fog pt-4">
        {!user && (
          <p className="mb-2 text-xs text-muted">
            <Link
              href={`/login?returnUrl=${encodeURIComponent(`/itens/${itemId}`)}`}
              className="font-medium text-brand hover:underline"
            >
              Entre
            </Link>{" "}
            para perguntar ao anunciante.
          </p>
        )}
        <label className="sr-only" htmlFor={`comment-${itemId}`}>
          Seu comentário
        </label>
        <textarea
          id={`comment-${itemId}`}
          rows={3}
          maxLength={500}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Ex: Ainda está disponível? Aceita encontro no Bloco M?"
          className="w-full rounded-xl border border-fog bg-white px-3 py-2.5 text-sm outline-none transition-soft focus:border-brand focus:ring-2 focus:ring-brand/20"
          disabled={!user || submitting}
        />
        {error && (
          <p className="mt-2 text-xs text-red-600">{error}</p>
        )}
        <button
          type="submit"
          disabled={!user || submitting || body.trim().length < 2}
          className="mt-2 w-full rounded-full bg-navy px-4 py-2.5 text-sm font-semibold text-white transition-soft hover:bg-brand disabled:opacity-50"
        >
          {submitting ? "Enviando…" : "Publicar pergunta"}
        </button>
      </form>
    </section>
  );
}
