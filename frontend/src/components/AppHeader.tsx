"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useId, useRef, useState } from "react";
import { BrandLogo, DesapegaWordmark } from "@/components/BrandLogo";
import { ProfileAvatar, ProfileDrawer } from "@/components/ProfileDrawer";
import { SearchBar } from "@/components/SearchBar";
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
      <div className="mx-auto flex h-[61px] max-w-6xl items-center px-4" />
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
  const headerRef = useRef<HTMLElement>(null);
  const notifId = useId();

  const onApp = pathname === "/app" || pathname.startsWith("/app/");

  // Sync input from ?q= when on /app (deep links + live URL updates)
  useEffect(() => {
    if (onApp) {
      setQuery(searchParams.get("q") ?? "");
    }
  }, [onApp, searchParams]);

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
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      const qs = params.toString();
      router.push(qs ? `/app?${qs}` : "/app");
      setPanel(null);
    },
    [router],
  );

  const handleChange = (value: string) => {
    setQuery(value);
    if (onApp) {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) params.set("q", value);
      else params.delete("q");
      // Searching switches to explorar
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

  if (!user) {
    return (
      <header
        ref={headerRef}
        className="sticky top-0 z-30 border-b border-fog bg-white/95 backdrop-blur"
      >
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
          <Link href="/" className="group flex shrink-0 items-center gap-2 sm:gap-2.5">
            <BrandLogo
              mark="blue"
              height={28}
              className="transition-soft group-hover:scale-105"
            />
            <div className="hidden min-[380px]:block">
              <DesapegaWordmark className="text-sm sm:text-base" />
              <p className="text-[10px] font-medium leading-none text-muted">
                Unifor · campus
              </p>
            </div>
          </Link>

          <SearchBar value={query} onChange={handleChange} onSubmitSearch={goSearch} />

          <nav className="flex shrink-0 items-center gap-1.5">
            <Link
              href="/login"
              className="rounded-full border border-navy/25 px-3.5 py-1.5 text-sm font-semibold text-navy transition-soft hover:border-brand hover:text-brand"
            >
              Entrar
            </Link>
            <Link
              href="/registro"
              className="inline-flex items-center gap-1.5 rounded-full bg-navy px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition-soft hover:bg-brand sm:px-4 sm:py-2"
            >
              <PlusCircleIcon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Anunciar</span>
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
        className="sticky top-0 z-30 border-b border-fog bg-white/95 backdrop-blur"
      >
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
          <Link href="/" className="group flex shrink-0 items-center gap-2 sm:gap-2.5">
            <BrandLogo
              mark="blue"
              height={28}
              className="transition-soft group-hover:scale-105"
            />
            <div className="hidden min-[380px]:block">
              <DesapegaWordmark className="text-sm sm:text-base" />
              <p className="text-[10px] font-medium leading-none text-muted">
                Unifor · campus
              </p>
            </div>
          </Link>

          <SearchBar
            value={query}
            onChange={handleChange}
            onSubmitSearch={goSearch}
          />

          <nav className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <HeaderLink
              href="/app?tab=meus"
              label="Meus anúncios"
              icon={<GridIcon className="h-5 w-5" />}
            />

            <div className="relative">
              <HeaderIconButton
                label="Notificações"
                pressed={panel === "notifications"}
                controls={notifId}
                onClick={toggleNotifications}
                icon={<BellIcon className="h-5 w-5" />}
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
              className="ml-1 inline-flex max-w-[10rem] items-center gap-2 rounded-full border border-fog bg-white py-1 pl-1 pr-2.5 text-sm font-semibold text-navy transition-soft hover:border-brand hover:bg-mist sm:max-w-[12rem] sm:pr-3"
              aria-haspopup="dialog"
              aria-expanded={profileOpen}
            >
              <ProfileAvatar user={user} size={28} />
              <span className="min-w-0 truncate">{user.name.split(" ")[0]}</span>
              <ChevronIcon className="h-3.5 w-3.5 shrink-0 text-muted" />
            </button>

            <Link
              href="/app?tab=anunciar"
              className="ml-0.5 inline-flex items-center gap-1.5 rounded-full bg-navy px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition-soft hover:bg-brand sm:px-4 sm:py-2"
            >
              <PlusCircleIcon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Anunciar</span>
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
    </>
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
      className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-navy/75 transition-soft hover:bg-mist hover:text-navy ${className}`}
    >
      <span className="text-navy/60">{icon}</span>
      <span className="hidden lg:inline">{label}</span>
      <span className="sr-only lg:hidden">{label}</span>
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
      aria-expanded={pressed}
      aria-controls={controls}
      onClick={onClick}
      className={`relative inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium transition-soft ${
        pressed
          ? "bg-mist text-navy"
          : "text-navy/75 hover:bg-mist hover:text-navy"
      }`}
    >
      <span className="relative text-navy/60">
        {icon}
        {Boolean(badgeCount) && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
            {badgeCount! > 9 ? "9+" : badgeCount}
          </span>
        )}
      </span>
      <span className="hidden lg:inline">{label}</span>
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
      className="absolute right-0 top-full z-40 mt-2 w-[min(22rem,calc(100vw-1.5rem))] rounded-xl border border-fog bg-white shadow-lg"
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
