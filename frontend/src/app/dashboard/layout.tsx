"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AdminClock } from "@/components/AdminClock";
import { AdminGate } from "@/components/AdminGate";
import { AdminProfileDrawer } from "@/components/AdminProfileDrawer";
import { BrandLogo, BrandTagline, DesapegaWordmark } from "@/components/BrandLogo";
import { OfflineStatusBanner } from "@/components/OfflineBanner";
import { ProfileAvatar } from "@/components/ProfileDrawer";
import { isSuperAdmin } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type NavItem = {
  href: string;
  label: string;
  exact?: boolean;
  superOnly?: boolean;
  icon: ReactNode;
};

const NAV: NavItem[] = [
  {
    href: "/dashboard",
    label: "Visão geral",
    exact: true,
    icon: <OverviewIcon />,
  },
  {
    href: "/dashboard/users",
    label: "Usuários",
    icon: <UsersIcon />,
  },
  {
    href: "/dashboard/items",
    label: "Anúncios",
    icon: <ItemsIcon />,
  },
  {
    href: "/dashboard/support",
    label: "Suporte",
    icon: <SupportIcon />,
  },
  {
    href: "/dashboard/audit",
    label: "Auditoria",
    icon: <AuditIcon />,
  },
  {
    href: "/dashboard/admins",
    label: "Admins",
    superOnly: true,
    icon: <ShieldIcon />,
  },
];

const RAIL_W = "4.25rem";
const DRAWER_W = "15rem";

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
  const [expanded, setExpanded] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const items = NAV.filter((item) => !item.superOnly || superAdmin);

  const isActive = (item: NavItem) =>
    item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`);

  const handleSignOut = () => {
    signOut();
    router.replace("/admin");
  };

  return (
    <div className="flex min-h-screen flex-col bg-mist">
      <header
        className={`header-animate sticky top-0 z-40 border-b border-fog bg-white/95 backdrop-blur transition-soft ${
          scrolled ? "header-scrolled" : ""
        }`}
      >
        <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-3 py-3 sm:gap-4 sm:px-5 sm:py-3.5">
          <Link
            href="/dashboard"
            className="header-nav-item group flex shrink-0 items-center gap-2.5 sm:gap-3"
          >
            <BrandLogo
              mark="blue"
              height={40}
              className="transition-soft group-hover:opacity-90"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <DesapegaWordmark className="text-base leading-tight sm:text-lg md:text-xl" />
                <span className="rounded-full bg-navy/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-navy">
                  Admin
                </span>
              </div>
              <BrandTagline className="mt-0.5 hidden text-xs sm:text-sm md:block" />
            </div>
          </Link>

          <div className="ml-auto flex items-center gap-3 sm:gap-4">
            <AdminClock />

            <Link
              href="/"
              className="hidden rounded-full border border-navy/20 px-3.5 py-2 text-sm font-semibold text-navy transition-soft hover:border-brand hover:text-brand sm:inline-flex"
            >
              Marketplace
            </Link>

            {user && (
              <button
                type="button"
                onClick={() => setProfileOpen(true)}
                className="flex items-center gap-2 rounded-full border border-fog bg-white py-1 pl-1 pr-2.5 transition-soft hover:border-brand/40 hover:bg-mist/50 sm:pr-3"
                aria-label={`Perfil admin de ${user.name}`}
                aria-haspopup="dialog"
                aria-expanded={profileOpen}
              >
                <ProfileAvatar user={user} size={36} />
                <span className="hidden max-w-[10rem] truncate text-sm font-semibold text-navy sm:inline">
                  {user.name.split(" ")[0]}
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      <OfflineStatusBanner />

      <div className="relative flex min-h-0 flex-1">
        {/* Espaço reservado + hit-area à esquerda (desktop) */}
        <div
          className="relative z-30 hidden shrink-0 md:block"
          style={{ width: RAIL_W }}
          onMouseEnter={() => setExpanded(true)}
          onMouseLeave={() => setExpanded(false)}
        >
          {/* Faixa extra na borda da tela para facilitar o hover */}
          <div className="absolute inset-y-0 -left-2 w-2" aria-hidden />

          <aside
            className="absolute inset-y-0 left-0 flex h-full flex-col overflow-hidden border-r border-white/10 bg-navy-deep text-white shadow-[8px_0_24px_rgba(10,31,77,0.18)] transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ width: expanded ? DRAWER_W : RAIL_W }}
          >
            <nav className="flex flex-1 flex-col gap-1 p-2.5 pt-4">
              {items.map((item) => {
                const active = isActive(item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    className={`flex h-11 items-center gap-3 rounded-xl px-3 transition-colors duration-200 ${
                      active
                        ? "bg-white/15 text-white"
                        : "text-white/65 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center [&>svg]:h-5 [&>svg]:w-5">
                      {item.icon}
                    </span>
                    <span
                      className={`truncate text-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                        expanded
                          ? "translate-x-0 opacity-100"
                          : "pointer-events-none -translate-x-3 opacity-0"
                      }`}
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <nav className="flex gap-1 overflow-x-auto border-b border-fog bg-white px-3 py-2 md:hidden">
            {items.map((item) => {
              const active = isActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${
                    active ? "bg-mist text-navy" : "text-muted"
                  }`}
                >
                  <span className="flex h-4 w-4 items-center justify-center [&>svg]:h-4 [&>svg]:w-4">
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <main className="flex-1 animate-fade-in p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>

      {user && (
        <AdminProfileDrawer
          open={profileOpen}
          user={user}
          onClose={() => setProfileOpen(false)}
          onSignOut={handleSignOut}
        />
      )}
    </div>
  );
}

function OverviewIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10.5V20h6v-9.5H4zM14 4v16h6V4h-6zM4 4v4h6V4H4z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ItemsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7h16M4 12h16M4 17h10"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.75"
      />
    </svg>
  );
}

function SupportIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 22a9 9 0 1 0-9-9c0 1.8.5 3.5 1.5 4.9L3 22l4.1-1.5A9 9 0 0 0 12 22z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AuditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 12h6M9 16h4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3l8 3v6c0 5-3.5 8.5-8 9.5C7.5 20.5 4 17 4 12V6l8-3z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 12.5l1.8 1.8 3.7-3.8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
