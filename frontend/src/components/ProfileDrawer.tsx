"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId } from "react";
import type { SessionUser } from "@/lib/api";

type ProfileDrawerProps = {
  open: boolean;
  user: SessionUser;
  onClose: () => void;
  onSignOut: () => void;
};

const MENU_ITEMS = [
  {
    href: "/app?tab=meus",
    label: "Meus anúncios",
    description: "Gerencie o que você publicou",
    icon: "grid",
  },
  {
    href: "/app?tab=meus&view=concluidos",
    label: "Minhas vendas / doações",
    description: "Itens já concluídos",
    icon: "check",
  },
  {
    href: "/conta/compras",
    label: "Minhas compras",
    description: "Itens em que você demonstrou interesse",
    icon: "bag",
  },
  {
    href: "/conta",
    label: "Minha conta",
    description: "Nome, e-mail e WhatsApp",
    icon: "user",
  },
] as const;

export function ProfileDrawer({
  open,
  user,
  onClose,
  onSignOut,
}: ProfileDrawerProps) {
  const titleId = useId();
  const firstName = user.name.split(" ")[0] ?? user.name;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="presentation">
      <button
        type="button"
        aria-label="Fechar menu"
        className="absolute inset-0 bg-navy/40 backdrop-blur-[1px] animate-fade-in"
        onClick={onClose}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-white shadow-2xl animate-drawer-in"
      >
        <div className="flex items-start justify-between gap-3 border-b border-fog px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <ProfileAvatar user={user} size={48} />
            <div className="min-w-0">
              <p
                id={titleId}
                className="truncate font-[family-name:var(--font-display)] text-lg font-bold text-navy"
              >
                {firstName}
              </p>
              <p className="truncate text-sm text-muted">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-soft hover:bg-mist hover:text-navy"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <ul className="flex flex-col gap-0.5">
            {MENU_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 transition-soft hover:bg-mist"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mist text-navy">
                    <MenuIcon name={item.icon} className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-navy">
                      {item.label}
                    </span>
                    <span className="block text-xs text-muted">
                      {item.description}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-fog p-4">
          <button
            type="button"
            onClick={() => {
              onClose();
              onSignOut();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition-soft hover:bg-red-50"
          >
            Sair da conta
          </button>
        </div>
      </aside>
    </div>
  );
}

export function ProfileAvatar({
  user,
  size = 32,
}: {
  user: SessionUser;
  size?: number;
}) {
  const initial = (user.name.trim()[0] ?? "?").toUpperCase();

  if (user.avatarUrl) {
    return (
      <Image
        src={user.avatarUrl}
        alt=""
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-navy font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden
    >
      {initial}
    </span>
  );
}

function MenuIcon({
  name,
  className,
}: {
  name: (typeof MENU_ITEMS)[number]["icon"];
  className?: string;
}) {
  if (name === "grid") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
      </svg>
    );
  }
  if (name === "check") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
        <path
          d="M8 12.5l2.5 2.5L16 9.5"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (name === "bag") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M6 8h12l-1 12H7L6 8z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
        <path
          d="M9 8V6.5a3 3 0 0 1 6 0V8"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="9" r="3.5" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M5.5 19.5c1.5-3 4-4.5 6.5-4.5s5 1.5 6.5 4.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
