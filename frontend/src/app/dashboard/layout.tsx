"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { AdminGate } from "@/components/AdminGate";
import { BrandLogo, DesapegaWordmark } from "@/components/BrandLogo";
import { isSuperAdmin } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const NAV = [
  { href: "/dashboard", label: "Visão geral", exact: true },
  { href: "/dashboard/users", label: "Usuários" },
  { href: "/dashboard/support", label: "Suporte" },
  { href: "/dashboard/admins", label: "Admins", superOnly: true },
] as const;

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGate>
      <DashboardShell>{children}</DashboardShell>
    </AdminGate>
  );
}

function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const superAdmin = isSuperAdmin(user);

  return (
    <div className="flex min-h-[calc(100vh-0px)] bg-mist">
      <aside className="hidden w-60 shrink-0 flex-col bg-navy-deep text-white md:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <BrandLogo mark="white" height={32} />
            <div>
              <DesapegaWordmark tone="light" className="text-sm" />
              <p className="text-[10px] uppercase tracking-wider text-white/50">
                Admin
              </p>
            </div>
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-3">
          {NAV.filter((item) => !("superOnly" in item && item.superOnly) || superAdmin).map(
            (item) => {
              const active =
                "exact" in item && item.exact
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-soft ${
                    active
                      ? "bg-white/15 text-white"
                      : "text-white/65 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            },
          )}
        </nav>
        <div className="border-t border-white/10 p-4">
          <p className="truncate text-sm font-medium text-white">{user?.name}</p>
          <p className="truncate text-xs text-white/50">{user?.email}</p>
          <div className="mt-3 flex flex-col gap-1.5">
            <Link
              href="/"
              className="text-xs font-medium text-white/60 transition-soft hover:text-white"
            >
              Ir ao marketplace
            </Link>
            <button
              type="button"
              onClick={() => {
                signOut();
                router.replace("/admin");
              }}
              className="text-left text-xs font-medium text-white/60 transition-soft hover:text-white"
            >
              Sair
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-fog bg-white px-4 py-3 md:hidden">
          <DesapegaWordmark className="text-base" />
          <button
            type="button"
            onClick={() => {
              signOut();
              router.replace("/admin");
            }}
            className="text-sm font-medium text-brand"
          >
            Sair
          </button>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-fog bg-white px-3 py-2 md:hidden">
          {NAV.filter((item) => !("superOnly" in item && item.superOnly) || superAdmin).map(
            (item) => {
              const active =
                "exact" in item && item.exact
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium ${
                    active ? "bg-mist text-navy" : "text-muted"
                  }`}
                >
                  {item.label}
                </Link>
              );
            },
          )}
        </nav>
        <main className="flex-1 animate-fade-in p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
