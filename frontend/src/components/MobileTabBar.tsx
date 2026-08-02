"use client";

import type { ReactNode } from "react";

type Tab = "explorar" | "anunciar" | "meus";

type TabIconProps = { className?: string; active?: boolean };

const TABS: {
  id: Tab;
  label: string;
  Icon: (props: TabIconProps) => ReactNode;
}[] = [
  { id: "explorar", label: "Explorar", Icon: ExploreIcon },
  { id: "anunciar", label: "Anunciar", Icon: AnnounceIcon },
  { id: "meus", label: "Meus anúncios", Icon: AdsIcon },
];

type MobileTabBarProps = {
  active: Tab;
  onSelect: (tab: Tab) => void;
};

/** Bottom nav OLX-like — only visible on mobile (md:hidden). */
export function MobileTabBar({ active, onSelect }: MobileTabBarProps) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-fog bg-white/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "max(0.4rem, env(safe-area-inset-bottom))" }}
      aria-label="Navegação principal"
    >
      <div className="mx-auto flex w-full max-w-lg items-end justify-between px-2 pt-1">
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
                  className={`text-[11px] font-semibold ${
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
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold transition-soft ${
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
                <span className="mt-0.5 h-0.5 w-6 rounded-full bg-navy" aria-hidden />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function ExploreIcon({ className }: { className?: string; active?: boolean }) {
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

function AnnounceIcon({ className }: { className?: string; active?: boolean }) {
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

function AdsIcon({ className }: { className?: string; active?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5v-7z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M12 12v8M4.5 9.2 12 13.5l7.5-4.3"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
