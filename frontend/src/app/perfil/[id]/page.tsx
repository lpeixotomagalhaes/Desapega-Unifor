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
  type ProfileCompletedDeal,
  type PublicProfile,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatBrazilianPhoneDisplay } from "@/lib/phone";

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
        width={96}
        height={96}
        className="h-24 w-24 rounded-full object-cover ring-2 ring-fog"
      />
    );
  }
  return (
    <span className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-navy text-3xl font-bold text-white ring-2 ring-fog">
      {initial}
    </span>
  );
}

function formatPrice(price: string | null, isDonation: boolean) {
  if (isDonation) return "Doação";
  if (price == null) return "—";
  const n = Number(price);
  if (Number.isNaN(n)) return "—";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function DealHistoryCard({ deal }: { deal: ProfileCompletedDeal }) {
  return (
    <li className="flex gap-3 rounded-xl border border-fog bg-white p-3 transition-soft hover:border-brand/30">
      <Link
        href={`/itens/${deal.item.id}`}
        className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-mist"
      >
        <Image
          src={resolveImageUrl(deal.item.imageUrl)}
          alt=""
          fill
          className="object-cover"
          sizes="64px"
        />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/itens/${deal.item.id}`}
              className="line-clamp-1 text-sm font-semibold text-navy hover:underline"
            >
              {deal.item.title}
            </Link>
            <p className="mt-0.5 text-xs text-muted">
              {deal.item.isDonation ? "Doação" : "Venda"} ·{" "}
              {formatPrice(deal.item.price, deal.item.isDonation)} · para{" "}
              <Link
                href={`/perfil/${deal.buyer.id}`}
                className="font-medium text-brand hover:underline"
              >
                {deal.buyer.name}
              </Link>
            </p>
          </div>
          {deal.review ? (
            <StarRatingDisplay value={deal.review.rating} size="sm" />
          ) : (
            <span className="rounded-full bg-mist px-2 py-0.5 text-[11px] font-medium text-muted">
              Sem avaliação
            </span>
          )}
        </div>
        {deal.review?.comment ? (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-navy/75">
            “{deal.review.comment}”
          </p>
        ) : null}
        <p className="mt-1 text-[11px] text-muted">
          {new Date(deal.review?.createdAt ?? deal.updatedAt).toLocaleDateString(
            "pt-BR",
            { day: "2-digit", month: "short", year: "numeric" },
          )}
        </p>
      </div>
    </li>
  );
}

export default function PublicProfilePage() {
  const params = useParams<{ id: string }>();
  const { user: me } = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<"historico" | "anuncios">("historico");

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
      <div className="mx-auto w-full max-w-6xl flex-1 animate-pulse px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="h-80 rounded-2xl bg-fog" />
          <div className="space-y-3">
            <div className="h-8 w-40 rounded bg-fog" />
            <div className="h-40 rounded-2xl bg-mist" />
          </div>
        </div>
      </div>
    );
  }

  const {
    user,
    online,
    ratingAvg,
    ratingCount,
    activeItems,
    completedDeals,
  } = profile;
  const isOwn = me?.id === user.id;
  const memberSince = new Date(user.createdAt).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  const salesCount = completedDeals.filter((d) => !d.item.isDonation).length;
  const donationCount = completedDeals.filter((d) => d.item.isDonation).length;

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:py-8">
      <Link
        href="/app"
        className="mb-4 inline-flex text-sm font-medium text-muted transition-soft hover:text-navy"
      >
        ← Voltar
      </Link>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(280px,340px)_1fr]">
        {/* Card de informações públicas */}
        <aside className="rounded-2xl border border-fog bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <ProfileAvatarLarge name={user.name} avatarUrl={user.avatarUrl} />
              <span
                className={`absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full ring-2 ring-white ${
                  online ? "bg-emerald-500" : "bg-slate-300"
                }`}
                title={online ? "Online" : "Offline"}
              />
            </div>

            <h1 className="mt-3 font-display text-xl font-bold text-navy">
              {user.name}
            </h1>
            {isOwn && (
              <span className="mt-1 rounded-full bg-mist px-2.5 py-0.5 text-xs font-semibold text-navy/70">
                Seu perfil
              </span>
            )}

            <div
              className={`mt-2 inline-flex items-center gap-1.5 text-sm font-medium ${
                online ? "text-emerald-700" : "text-muted"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  online ? "bg-emerald-500" : "bg-slate-300"
                }`}
              />
              {online ? "Online" : "Offline"}
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm text-muted">
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
            </div>
            <p className="mt-1 text-xs text-muted">
              No Desapega desde {memberSince}
            </p>
          </div>

          <dl className="mt-5 space-y-3 border-t border-fog pt-5 text-left">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                Nome
              </dt>
              <dd className="mt-0.5 text-sm font-medium text-navy">{user.name}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                E-mail
              </dt>
              <dd className="mt-0.5 break-all text-sm font-medium text-navy">
                {user.email}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                Telefone / WhatsApp
              </dt>
              <dd className="mt-0.5 text-sm font-medium text-navy">
                {user.phone ? (
                  <a
                    href={`https://wa.me/${user.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand hover:underline"
                  >
                    {formatBrazilianPhoneDisplay(user.phone)}
                  </a>
                ) : (
                  <span className="text-muted">Não informado</span>
                )}
              </dd>
            </div>
            {user.bio ? (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Sobre
                </dt>
                <dd className="mt-0.5 text-sm leading-relaxed text-navy/80">
                  {user.bio}
                </dd>
              </div>
            ) : isOwn ? (
              <p className="text-sm text-muted">
                Sem bio.{" "}
                <Link href="/conta" className="font-medium text-brand hover:underline">
                  Editar na conta
                </Link>
              </p>
            ) : null}
          </dl>

          <div className="mt-5 grid grid-cols-3 gap-2 border-t border-fog pt-4 text-center">
            <div>
              <p className="text-lg font-bold text-navy">{activeItems.length}</p>
              <p className="text-[11px] text-muted">Ativos</p>
            </div>
            <div>
              <p className="text-lg font-bold text-navy">{salesCount}</p>
              <p className="text-[11px] text-muted">Vendas</p>
            </div>
            <div>
              <p className="text-lg font-bold text-navy">{donationCount}</p>
              <p className="text-[11px] text-muted">Doações</p>
            </div>
          </div>

          {isOwn && (
            <Link
              href="/conta"
              className="mt-5 flex w-full items-center justify-center rounded-full bg-navy px-4 py-2.5 text-sm font-semibold text-white transition-soft hover:bg-brand"
            >
              Editar perfil
            </Link>
          )}
        </aside>

        {/* Histórico + anúncios */}
        <section className="min-w-0">
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTab("historico")}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-soft ${
                tab === "historico"
                  ? "bg-navy text-white"
                  : "border border-fog bg-white text-muted"
              }`}
            >
              Histórico ({completedDeals.length})
            </button>
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
          </div>

          {tab === "historico" && (
            <div>
              <div className="mb-3">
                <h2 className="font-display text-lg font-bold text-navy">
                  Histórico
                </h2>
                <p className="text-sm text-muted">
                  Vendas e doações concluídas e as avaliações recebidas.
                </p>
              </div>
              {completedDeals.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-fog bg-white px-6 py-14 text-center">
                  <p className="text-sm font-medium text-navy">
                    Nenhuma venda ou doação concluída ainda.
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Quando um pedido for marcado como entregue, aparece aqui com a
                    avaliação.
                  </p>
                </div>
              ) : (
                <ul className="flex flex-col gap-3">
                  {completedDeals.map((deal, i) => (
                    <Reveal
                      key={deal.id}
                      delay={Math.min(i, 6) * 40}
                      variant="slide-up"
                    >
                      <DealHistoryCard deal={deal} />
                    </Reveal>
                  ))}
                </ul>
              )}
            </div>
          )}

          {tab === "anuncios" && (
            <div>
              <div className="mb-3">
                <h2 className="font-display text-lg font-bold text-navy">
                  Anúncios publicados
                </h2>
                <p className="text-sm text-muted">
                  {activeItems.length} de {activeItems.length} anúncio
                  {activeItems.length === 1 ? "" : "s"} ativo
                  {activeItems.length === 1 ? "" : "s"}.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {activeItems.length === 0 ? (
                  <p className="col-span-full rounded-2xl border border-dashed border-fog bg-white px-6 py-14 text-center text-sm text-muted">
                    Este vendedor ainda não possui anúncios publicados.
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
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
