"use client";

import Link from "next/link";
import { useEffect, useId } from "react";
import { ProfileAvatar } from "@/components/ProfileDrawer";
import { isSuperAdmin, type SessionUser } from "@/lib/api";

type AdminProfileDrawerProps = {
  open: boolean;
  user: SessionUser;
  onClose: () => void;
  onSignOut: () => void;
};

const ADMIN_LINKS = [
  { href: "/dashboard", label: "Visão geral", description: "Métricas e gráficos" },
  { href: "/dashboard/users", label: "Usuários", description: "Banir, suspender e reativar" },
  { href: "/dashboard/items", label: "Anúncios", description: "Remover ou excluir itens" },
  { href: "/dashboard/support", label: "Suporte", description: "Responder reclamações" },
  { href: "/dashboard/audit", label: "Auditoria", description: "Histórico de ações" },
] as const;

export function AdminProfileDrawer({
  open,
  user,
  onClose,
  onSignOut,
}: AdminProfileDrawerProps) {
  const titleId = useId();
  const firstName = user.name.split(" ")[0] ?? user.name;
  const roleLabel =
    user.role === "SUPER_ADMIN"
      ? "Super admin"
      : user.role === "ADMIN"
        ? "Administrador"
        : "Usuário";

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
              <span className="mt-1 inline-flex rounded-full bg-navy/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-navy">
                {roleLabel}
              </span>
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

        <div className="border-b border-fog px-5 py-3 text-sm text-muted">
          <p className="font-medium text-navy">Painel administrativo</p>
          <p className="mt-0.5 text-xs">
            Ações de moderação e gestão do Desapega UNIFOR.
          </p>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <ul className="flex flex-col gap-0.5">
            {ADMIN_LINKS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className="flex flex-col rounded-xl px-3 py-3 transition-soft hover:bg-mist"
                >
                  <span className="text-sm font-semibold text-navy">
                    {item.label}
                  </span>
                  <span className="text-xs text-muted">{item.description}</span>
                </Link>
              </li>
            ))}
            {isSuperAdmin(user) && (
              <li>
                <Link
                  href="/dashboard/admins"
                  onClick={onClose}
                  className="flex flex-col rounded-xl px-3 py-3 transition-soft hover:bg-mist"
                >
                  <span className="text-sm font-semibold text-navy">Admins</span>
                  <span className="text-xs text-muted">
                    Promover ou revogar administradores
                  </span>
                </Link>
              </li>
            )}
            <li>
              <Link
                href={`/perfil/${user.id}`}
                onClick={onClose}
                className="flex flex-col rounded-xl px-3 py-3 transition-soft hover:bg-mist"
              >
                <span className="text-sm font-semibold text-navy">
                  Meu perfil
                </span>
                <span className="text-xs text-muted">
                  Dados pessoais e acadêmicos
                </span>
              </Link>
            </li>
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
            Sair do painel
          </button>
        </div>
      </aside>
    </div>
  );
}
