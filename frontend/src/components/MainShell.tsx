"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Reserva espaço pro MobileTabBar; em auth o footer some, então some o padding. */
export function MainShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuth =
    pathname.startsWith("/login") ||
    pathname.startsWith("/registro") ||
    pathname.startsWith("/completar-perfil") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/auth/");

  return (
    <div
      className={`flex min-h-0 flex-1 flex-col ${
        isAuth ? "pb-0" : "pb-24 md:pb-0"
      }`}
    >
      {children}
    </div>
  );
}
