"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useId, useRef, useState } from "react";
import { BrandLogo, BrandTagline, DesapegaWordmark } from "@/components/BrandLogo";
import { ProfileAvatar, ProfileDrawer } from "@/components/ProfileDrawer";
import { SearchBar } from "@/components/SearchBar";
import { SupportComplaintModal } from "@/components/SupportComplaintModal";
import type { AppNotification } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useNotifications } from "@/lib/notifications";

type Panel = "notifications" | null;

export function AppHeader() {
  return (
    <Suspense fallback={<AppHeaderSkeleton />}>
      <AppHeaderInner />
    </Suspense>
  );
}

function AppHeaderSkeleton() {
  return (
    <header className="sticky top-0 z-30 border-b border-fog bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center px-4 sm:h-[80px]" />
    </header>
  );
}

function AppHeaderInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, signOut } = useAuth();
  const notifications = useNotifications();
  const [query, setQuery] = useState("");
  const [panel, setPanel] = useState<Panel>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const notifId = useId();

  const onApp = pathname === "/app" || pathname.startsWith("/app/");
  const isAdminSurface =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/auth/");

  // Sync input from ?q= when on /app; limpa ao sair da área de busca
  useEffect(() => {
    if (onApp) {
      setQuery(searchParams.get("q") ?? "");
    } else {
      setQuery("");
    }
  }, [onApp, searchParams]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!panel) return;
    const onPointerDown = (e: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setPanel(null);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPanel(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [panel]);

  const goSearch = useCallback(
    (value: string) => {
      const q = value.trim();
      setQuery(q);
      // Enter vazio → /app sem ?q= (todos os anúncios)
      if (!q) {
        router.push("/app");
        setPanel(null);
        return;
      }
      const params = new URLSearchParams();
      params.set("q", q);
      router.push(`/app?${params.toString()}`);
      setPanel(null);
    },
    [router],
  );

  const handleChange = (value: string) => {
    setQuery(value);
    if (onApp) {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) params.set("q", value.trim());
      else params.delete("q");
      // Busca sempre no explorar (todos os anúncios se q vazio)
      params.delete("tab");
      const qs = params.toString();
      router.replace(qs ? `/app?${qs}` : "/app", { scroll: false });
    }
  };

  const toggleNotifications = () => {
    setPanel((prev) => {
      const next = prev === "notifications" ? null : "notifications";
      if (next === "notifications") void notifications.refresh();
      return next;
    });
  };

  if (isAdminSurface) {
    return null;
  }

  if (!user) {
    const isAuthPage =
      pathname.startsWith("/login") ||
      pathname.startsWith("/registro") ||
      pathname.startsWith("/completar-perfil");

    return (
      <header
        ref={headerRef}
        className={`header-animate sticky top-0 z-30 border-b border-fog bg-white/95 backdrop-blur transition-soft ${
          scrolled ? "header-scrolled" : ""
        }`}
      >
        <div
          className={`mx-auto max-w-7xl items-center gap-x-3 gap-y-2.5 px-3 py-3 sm:gap-x-4 sm:px-5 sm:py-3.5 ${
            isAuthPage
              ? "flex"
              : "grid grid-cols-[auto_1fr_auto] md:flex md:gap-4"
          }`}
        >
          <Link
            href="/"
            className="header-nav-item group col-start-1 row-start-1 flex shrink-0 items-center gap-2.5 sm:gap-3"
            style={{ animationDelay: "0.05s" }}
          >
            <BrandLogo
              mark="blue"
              height={40}
              className="transition-soft group-hover:opacity-90"
            />
            <div className="hidden min-[360px]:block">
              <DesapegaWordmark className="text-base leading-tight sm:text-lg md:text-xl" />
              <BrandTagline className="mt-0.5 text-xs sm:text-sm" />
            </div>
          </Link>

          {!isAuthPage && (
            <div
              className="header-nav-item col-span-3 row-start-2 min-w-0 md:order-none md:col-auto md:row-auto md:flex-1"
              style={{ animationDelay: "0.1s" }}
            >
              <SearchBar
                value={query}
                onChange={handleChange}
                onSubmitSearch={goSearch}
              />
              <BrandTagline className="mt-1.5 text-xs md:hidden" />
            </div>
          )}

          <nav
            className="header-nav-item col-start-3 row-start-1 ml-auto flex shrink-0 items-center gap-2 md:ml-0"
            style={{ animationDelay: "0.16s" }}
          >
            <Link
              href="/login"
              className={`rounded-full border px-3.5 py-2 text-sm font-semibold transition-soft sm:px-4 sm:text-base ${
                pathname.startsWith("/login")
                  ? "border-brand bg-brand/5 text-brand"
                  : "border-navy/25 text-navy hover:border-brand hover:text-brand"
              }`}
            >
              Entrar
            </Link>
            <Link
              href="/registro"
              className={`hidden items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm transition-soft sm:inline-flex sm:px-5 sm:py-2.5 sm:text-base ${
                pathname.startsWith("/registro")
                  ? "bg-brand hover:bg-brand-bright"
                  : "bg-navy hover:bg-brand"
              }`}
            >
              <PlusCircleIcon className="h-5 w-5 shrink-0" />
              {pathname.startsWith("/registro") ? "Criar conta" : "Anunciar"}
            </Link>
          </nav>
        </div>
      </header>
    );
  }

  return (
    <>
      <header
        ref={headerRef}
        className={`header-animate sticky top-0 z-30 border-b border-fog bg-white/95 backdrop-blur transition-soft ${
          scrolled ? "header-scrolled" : ""
        }`}
      >
        <div className="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2.5 px-3 py-3 sm:gap-x-4 sm:px-5 sm:py-3.5 md:flex md:gap-4">
          <Link
            href="/"
            className="header-nav-item group col-start-1 row-start-1 flex shrink-0 items-center gap-2.5 sm:gap-3"
            style={{ animationDelay: "0.05s" }}
          >
            <BrandLogo
              mark="blue"
              height={40}
              className="transition-soft group-hover:opacity-90"
            />
            <div className="hidden min-[360px]:block">
              <DesapegaWordmark className="text-base leading-tight sm:text-lg md:text-xl" />
              <BrandTagline className="mt-0.5 hidden text-xs sm:text-sm md:block" />
            </div>
          </Link>

          <div
            className="header-nav-item col-span-3 row-start-2 min-w-0 md:order-none md:col-auto md:row-auto md:flex-1"
            style={{ animationDelay: "0.1s" }}
          >
            <SearchBar
              value={query}
              onChange={handleChange}
              onSubmitSearch={goSearch}
            />
            <BrandTagline className="mt-1.5 text-xs md:hidden" />
          </div>

          <nav
            className="header-nav-item col-start-3 row-start-1 ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5 md:ml-0"
            style={{ animationDelay: "0.16s" }}
          >
            <HeaderLink
              href="/app?tab=meus"
              label="Meus anúncios"
              icon={<GridIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
              className="hidden md:inline-flex"
            />

            <HeaderIconButton
              label="Reclamar"
              pressed={supportOpen}
              controls="support-complaint-modal"
              onClick={() => {
                setPanel(null);
                setSupportOpen(true);
              }}
              icon={<SupportIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
            />

            <div className="relative">
              <HeaderIconButton
                label="Notificações"
                pressed={panel === "notifications"}
                controls={notifId}
                onClick={toggleNotifications}
                icon={<BellIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
                badgeCount={notifications.unreadCount}
              />
              {panel === "notifications" && (
                <NotificationsPanel
                  id={notifId}
                  notifications={notifications.notifications}
                  loaded={notifications.loaded}
                  onMarkRead={notifications.markRead}
                  onMarkAllRead={notifications.markAllRead}
                  onNavigate={() => setPanel(null)}
                />
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setPanel(null);
                setProfileOpen(true);
              }}
              className="ml-0.5 inline-flex items-center gap-2 rounded-full border border-fog bg-white p-1 text-sm font-semibold text-navy transition-soft hover:border-brand hover:bg-mist sm:max-w-[14rem] sm:py-1.5 sm:pl-1.5 sm:pr-3.5 sm:text-base"
              aria-haspopup="dialog"
              aria-expanded={profileOpen}
              aria-label={`Perfil de ${user.name}`}
            >
              <ProfileAvatar user={user} size={32} />
              <span className="hidden min-w-0 truncate sm:inline">
                {user.name.split(" ")[0]}
              </span>
              <ChevronIcon className="hidden h-4 w-4 shrink-0 text-muted sm:block" />
            </button>

            <Link
              href="/app?tab=anunciar"
              className="ml-0.5 hidden items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white shadow-sm transition-soft hover:bg-brand md:inline-flex sm:px-5 sm:py-2.5 sm:text-base"
            >
              <PlusCircleIcon className="h-5 w-5 shrink-0" />
              Anunciar
            </Link>
          </nav>
        </div>
      </header>

      <ProfileDrawer
        open={profileOpen}
        user={user}
        onClose={() => setProfileOpen(false)}
        onSignOut={() => {
          signOut();
          router.push("/");
        }}
      />

      <SupportComplaintModal
        open={supportOpen}
        onClose={() => setSupportOpen(false)}
      />
    </>
  );
}

function HeaderNavLabel({ label }: { label: string }) {
  return (
    <span
      className="header-nav-label max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium opacity-0 transition-[max-width,opacity,margin] duration-300 ease-out group-hover:max-w-[9rem] group-hover:opacity-100 group-hover:ml-1.5 group-focus-visible:max-w-[9rem] group-focus-visible:opacity-100 group-focus-visible:ml-1.5"
      aria-hidden
    >
      {label}
    </span>
  );
}

function HeaderLink({
  href,
  label,
  icon,
  className = "",
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className={`group inline-flex items-center rounded-lg px-2 py-1.5 text-navy/75 transition-soft hover:bg-mist hover:text-navy ${className}`}
    >
      <span className="shrink-0 text-navy/60 transition-soft group-hover:text-navy">
        {icon}
      </span>
      <HeaderNavLabel label={label} />
    </Link>
  );
}

function HeaderIconButton({
  label,
  icon,
  pressed,
  controls,
  onClick,
  badgeCount,
}: {
  label: string;
  icon: React.ReactNode;
  pressed: boolean;
  controls: string;
  onClick: () => void;
  badgeCount?: number;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-expanded={pressed}
      aria-controls={controls}
      onClick={onClick}
      className={`group relative inline-flex items-center rounded-lg px-2 py-1.5 transition-soft ${
        pressed
          ? "bg-mist text-navy"
          : "text-navy/75 hover:bg-mist hover:text-navy"
      }`}
    >
      <span className="relative shrink-0 text-navy/60 transition-soft group-hover:text-navy">
        {icon}
        {Boolean(badgeCount) && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
            {badgeCount! > 9 ? "9+" : badgeCount}
          </span>
        )}
      </span>
      <HeaderNavLabel label={label} />
    </button>
  );
}

function NotificationsPanel({
  id,
  notifications,
  loaded,
  onMarkRead,
  onMarkAllRead,
  onNavigate,
}: {
  id: string;
  notifications: AppNotification[];
  loaded: boolean;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onNavigate: () => void;
}) {
  const hasUnread = notifications.some((n) => !n.readAt);

  return (
    <div
      id={id}
      role="dialog"
      aria-label="Notificações"
      className="absolute right-0 top-full z-40 mt-2 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-fog bg-white shadow-lg animate-fade-in"
    >
      <div className="flex items-center justify-between border-b border-fog px-4 py-2.5">
        <p className="text-sm font-semibold text-navy">Notificações</p>
        {hasUnread && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="text-xs font-medium text-brand transition-soft hover:underline"
          >
            Marcar tudo como lido
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {!loaded ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-mist" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted">
            Nenhuma notificação por aqui ainda.
          </p>
        ) : (
          <ul>
            {notifications.map((n) => {
              const content = (
                <div
                  className={`flex flex-col gap-0.5 px-4 py-3 text-left transition-soft hover:bg-mist/70 ${
                    n.readAt ? "" : "bg-brand/5"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {!n.readAt && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                    )}
                    <p className="text-sm font-semibold text-navy">{n.title}</p>
                  </div>
                  <p className="text-xs leading-relaxed text-muted">{n.body}</p>
                  <p className="text-[11px] text-muted/70">
                    {new Date(n.createdAt).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              );

              return (
                <li key={n.id} className="border-b border-fog last:border-0">
                  {n.itemId ? (
                    <Link
                      href={`/itens/${n.itemId}`}
                      onClick={() => {
                        if (!n.readAt) onMarkRead(n.id);
                        onNavigate();
                      }}
                      className="block w-full"
                    >
                      {content}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => !n.readAt && onMarkRead(n.id)}
                      className="block w-full"
                    >
                      {content}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function SupportIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3a7 7 0 0 0-7 7v2.2A2.8 2.8 0 0 0 7.8 15H9v-4H6.2A5.8 5.8 0 0 1 12 5a5.8 5.8 0 0 1 5.8 6H15v4h1.2A2.8 2.8 0 0 0 19 12.2V10a7 7 0 0 0-7-7Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M9 15v1.5A2.5 2.5 0 0 0 11.5 19h1"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 10a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M10 19a2 2 0 0 0 4 0"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlusCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 8v8M8 12h8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 10l5 5 5-5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
