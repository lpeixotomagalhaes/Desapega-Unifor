"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ItemCard } from "@/components/ItemCard";
import { StarRatingDisplay } from "@/components/RatingModal";
import { Reveal } from "@/components/Reveal";
import {
  api,
  resolveImageUrl,
  type PublicProfile,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";

function ProfileAvatarLarge({
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
        width={88}
        height={88}
        className="h-[88px] w-[88px] rounded-full object-cover"
      />
    );
  }
  return (
    <span className="inline-flex h-[88px] w-[88px] items-center justify-center rounded-full bg-navy text-3xl font-bold text-white">
      {initial}
    </span>
  );
}

export default function PublicProfilePage() {
  const params = useParams<{ id: string }>();
  const { user: me } = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<"anuncios" | "avaliacoes">("anuncios");

  useEffect(() => {
    let cancelled = false;
    setProfile(null);
    setNotFound(false);
    api
      .getUserProfile(params.id)
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (notFound) {
    return (
      <div className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-navy">Perfil não encontrado</h1>
        <Link href="/app" className="text-sm font-medium text-brand hover:underline">
          Voltar ao app
        </Link>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto w-full max-w-5xl flex-1 animate-pulse px-4 py-8">
        <div className="flex gap-4">
          <div className="h-[88px] w-[88px] rounded-full bg-fog" />
          <div className="flex-1 space-y-2 pt-2">
            <div className="h-7 w-48 rounded bg-fog" />
            <div className="h-4 w-32 rounded bg-mist" />
          </div>
        </div>
      </div>
    );
  }

  const { user, ratingAvg, ratingCount, reviews, activeItems } = profile;
  const isOwn = me?.id === user.id;
  const memberSince = new Date(user.createdAt).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:py-8">
      <Link
        href="/app"
        className="mb-4 inline-flex text-sm font-medium text-muted transition-soft hover:text-navy"
      >
        ← Voltar
      </Link>

      <header className="mb-8 flex flex-col gap-4 rounded-2xl border border-fog bg-white p-5 sm:flex-row sm:items-center sm:p-6">
        <ProfileAvatarLarge name={user.name} avatarUrl={user.avatarUrl} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-bold text-navy">
              {user.name}
            </h1>
            {isOwn && (
              <span className="rounded-full bg-mist px-2.5 py-0.5 text-xs font-semibold text-navy/70">
                Você
              </span>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted">
            {ratingCount > 0 ? (
              <>
                <StarRatingDisplay value={ratingAvg ?? 0} size="sm" />
                <span className="font-semibold text-navy">
                  {ratingAvg?.toFixed(1)}
                </span>
                <span>
                  ({ratingCount} avaliação{ratingCount === 1 ? "" : "ões"})
                </span>
              </>
            ) : (
              <span>Ainda sem avaliações</span>
            )}
            <span className="text-fog">·</span>
            <span>No Desapega desde {memberSince}</span>
          </div>
          {user.bio ? (
            <p className="mt-3 text-sm leading-relaxed text-navy/80">{user.bio}</p>
          ) : isOwn ? (
            <p className="mt-3 text-sm text-muted">
              Sem bio ainda.{" "}
              <Link href="/conta" className="font-medium text-brand hover:underline">
                Adicionar na minha conta
              </Link>
            </p>
          ) : null}
        </div>
      </header>

      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setTab("anuncios")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-soft ${
            tab === "anuncios"
              ? "bg-navy text-white"
              : "border border-fog bg-white text-muted"
          }`}
        >
          Anúncios ({activeItems.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("avaliacoes")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-soft ${
            tab === "avaliacoes"
              ? "bg-navy text-white"
              : "border border-fog bg-white text-muted"
          }`}
        >
          Avaliações ({ratingCount})
        </button>
      </div>

      {tab === "anuncios" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeItems.length === 0 ? (
            <p className="col-span-full rounded-xl border border-fog bg-white p-8 text-center text-sm text-muted">
              Nenhum anúncio ativo no momento.
            </p>
          ) : (
            activeItems.map((item, i) => (
              <Reveal
                key={item.id}
                delay={Math.min(i, 5) * 50}
                variant={i % 2 === 0 ? "slide-up" : "fade-up"}
              >
                <ItemCard item={item} />
              </Reveal>
            ))
          )}
        </div>
      )}

      {tab === "avaliacoes" && (
        <ul className="flex flex-col gap-3">
          {reviews.length === 0 ? (
            <li className="rounded-xl border border-fog bg-white p-8 text-center text-sm text-muted">
              Nenhuma avaliação ainda.
            </li>
          ) : (
            reviews.map((review, i) => (
              <Reveal key={review.id} delay={Math.min(i, 5) * 40} variant="slide-left">
                <li className="rounded-xl border border-fog bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/perfil/${review.rater.id}`}
                        className="text-sm font-semibold text-navy hover:underline"
                      >
                        {review.rater.name}
                      </Link>
                      <p className="text-xs text-muted">
                        sobre{" "}
                        <Link
                          href={`/itens/${review.order.item.id}`}
                          className="font-medium text-brand hover:underline"
                        >
                          {review.order.item.title}
                        </Link>
                      </p>
                    </div>
                    <StarRatingDisplay value={review.rating} size="sm" />
                  </div>
                  {review.comment && (
                    <p className="mt-2 text-sm leading-relaxed text-navy/80">
                      {review.comment}
                    </p>
                  )}
                  <p className="mt-2 text-[11px] text-muted">
                    {new Date(review.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </li>
              </Reveal>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
