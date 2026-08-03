"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type MobileChromeContextValue = {
  menuOpen: boolean;
  supportOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
  openSupport: () => void;
  closeSupport: () => void;
};

const MobileChromeContext = createContext<MobileChromeContextValue | null>(
  null,
);

export function MobileChromeProvider({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  const openMenu = useCallback(() => {
    setSupportOpen(false);
    setMenuOpen(true);
  }, []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const openSupport = useCallback(() => {
    setMenuOpen(false);
    setSupportOpen(true);
  }, []);
  const closeSupport = useCallback(() => setSupportOpen(false), []);

  const value = useMemo(
    () => ({
      menuOpen,
      supportOpen,
      openMenu,
      closeMenu,
      openSupport,
      closeSupport,
    }),
    [menuOpen, supportOpen, openMenu, closeMenu, openSupport, closeSupport],
  );

  return (
    <MobileChromeContext.Provider value={value}>
      {children}
    </MobileChromeContext.Provider>
  );
}

export function useMobileChrome(): MobileChromeContextValue {
  const ctx = useContext(MobileChromeContext);
  if (!ctx) {
    throw new Error("useMobileChrome must be used within MobileChromeProvider");
  }
  return ctx;
}
