"use client";

import Link from "next/link";
import { BrandLogo, BRAND_TAGLINE, DesapegaWordmark } from "@/components/BrandLogo";
import { Reveal } from "@/components/Reveal";
import { CATEGORIES, type Category } from "@/lib/api";

const NAV_LINKS = [
  { href: "/app", label: "Explorar" },
  { href: "/app?tab=anunciar", label: "Anunciar" },
  { href: "/app?tab=meus", label: "Meus anúncios" },
  { href: "/login", label: "Entrar" },
] as const;

const CATEGORY_KEYS = (Object.keys(CATEGORIES) as Category[]).slice(0, 5);

type SiteFooterProps = {
  /** Extra classes on the root <footer> (e.g. max-md:hidden). */
  className?: string;
};

export function SiteFooter({ className = "" }: SiteFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer
      className={`relative overflow-hidden bg-navy-deep text-white ${className}`.trim()}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 0% 0%, rgb(47 107 255 / 0.28), transparent 55%)",
        }}
      />

      <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:grid-cols-2 sm:px-6 sm:py-9 lg:grid-cols-3 lg:gap-10">
        <Reveal variant="slide-left">
          <Link href="/" className="group inline-flex items-center gap-2.5 transition-soft hover:opacity-90">
            <BrandLogo
              variant="horizontal"
              height={30}
            />
          </Link>
          <DesapegaWordmark tone="light" className="mt-3 block text-base" />
          <p className="mt-0.5 text-xs font-medium text-white/55">{BRAND_TAGLINE}</p>
          <p className="mt-2 max-w-xs text-xs leading-relaxed text-white/50">
            Economia circular no campus · Vortex {year}
          </p>
        </Reveal>

        <Reveal delay={60} className="sm:justify-self-center">
          <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white/40">
            Links
          </p>
          <ul className="flex flex-col gap-1.5">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="footer-link text-sm text-white/70">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal variant="slide-right" delay={100} className="sm:col-span-2 lg:col-span-1">
          <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white/40">
            Categorias
          </p>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_KEYS.map((key) => (
              <Link
                key={key}
                href={`/app?category=${key}`}
                scroll
                className="footer-chip"
              >
                {CATEGORIES[key]}
              </Link>
            ))}
          </div>
          <a
            href="https://www.unifor.br"
            target="_blank"
            rel="noreferrer"
            className="footer-link mt-4 inline-flex text-xs text-white/55"
          >
            unifor.br ↗
          </a>
        </Reveal>
      </div>

      <Reveal variant="fade" className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 text-[11px] text-white/40 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {year} Desapega UNIFOR</p>
          <p>Feito pra galera do campus</p>
        </div>
      </Reveal>
    </footer>
  );
}
