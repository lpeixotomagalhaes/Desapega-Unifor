"use client";

import type { ReactNode } from "react";

export type MobileTabId =
  | "inicio"
  | "buscar"
  | "anunciar"
  | "suporte"
  | "menu";

type TabIconProps = { className?: string; active?: boolean };

const TABS: {
  id: MobileTabId;
  label: string;
  Icon: (props: TabIconProps) => ReactNode;
}[] = [
  { id: "inicio", label: "Início", Icon: HomeIcon },
  { id: "buscar", label: "Buscar", Icon: SearchIcon },
  { id: "anunciar", label: "Anunciar", Icon: AnnounceIcon },
  { id: "suporte", label: "Suporte", Icon: SupportIcon },
  { id: "menu", label: "Menu", Icon: MenuIcon },
];

type MobileTabBarProps = {
  active: MobileTabId | null;
  onSelect: (tab: MobileTabId) => void;
};

/** Bottom nav estilo OLX — só no mobile (md:hidden). */
export function MobileTabBar({ active, onSelect }: MobileTabBarProps) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-fog bg-white/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "max(0.35rem, env(safe-area-inset-bottom))" }}
      aria-label="Navegação principal"
    >
      <div className="mx-auto flex w-full max-w-lg items-end justify-between px-1 pt-1">
        {TABS.map((t) => {
          const isActive = active === t.id;
          const isAnnounce = t.id === "anunciar";

          if (isAnnounce) {
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelect(t.id)}
                className="relative -mt-4 flex flex-1 flex-col items-center gap-0.5 pb-1"
                aria-current={isActive ? "page" : undefined}
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-full shadow-md transition-soft ${
                    isActive
                      ? "bg-brand text-white"
                      : "bg-navy text-white hover:bg-brand"
                  }`}
                >
                  <t.Icon className="h-6 w-6" active />
                </span>
                <span
                  className={`text-[10px] font-semibold ${
                    isActive ? "text-navy" : "text-muted"
                  }`}
                >
                  {t.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelect(t.id)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition-soft ${
                isActive ? "text-navy" : "text-muted hover:text-brand"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <t.Icon
                className={`h-6 w-6 ${isActive ? "text-navy" : "text-navy/45"}`}
                active={isActive}
              />
              {t.label}
              {isActive && (
                <span
                  className="mt-0.5 h-0.5 w-5 rounded-full bg-navy"
                  aria-hidden
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon({ className }: TabIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon({ className }: TabIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.85" />
      <path
        d="M20 20l-3.2-3.2"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AnnounceIcon({ className }: TabIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 7v10M7 12h10"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SupportIcon({ className }: TabIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3a8 8 0 0 0-8 8v2.5A2.5 2.5 0 0 0 6.5 16H8v-4H5.2A6.8 6.8 0 0 1 12 5a6.8 6.8 0 0 1 6.8 7H16v4h1.5a2.5 2.5 0 0 0 2.5-2.5V11a8 8 0 0 0-8-8z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 19.5c.8 1 1.9 1.5 2.5 1.5s1.7-.5 2.5-1.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MenuIcon({ className }: TabIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
      />
    </svg>
  );
}
