"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback } from "react";
import { MobileTabBar } from "@/components/MobileTabBar";

type Tab = "explorar" | "anunciar" | "meus";

function parseTab(value: string | null): Tab {
  return value === "anunciar" || value === "meus" ? value : "explorar";
}

/**
 * Footer mobile global. No Inspecionar (device mode), aparece em qualquer rota
 * com viewport &lt; md — antes só existia dentro de /app, por isso “sumia”.
 */
function MobileTabBarGlobalInner() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const hide =
    pathname.startsWith("/login") ||
    pathname.startsWith("/registro") ||
    pathname.startsWith("/completar-perfil") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/auth/");

  const onApp = pathname === "/app" || pathname.startsWith("/app/");
  const active: Tab = onApp ? parseTab(searchParams.get("tab")) : "explorar";

  const onSelect = useCallback(
    (tab: Tab) => {
      const params = new URLSearchParams();
      if (tab !== "explorar") params.set("tab", tab);
      if (onApp) {
        const q = searchParams.get("q");
        if (q) params.set("q", q);
      }
      const qs = params.toString();
      router.push(qs ? `/app?${qs}` : "/app");
    },
    [onApp, router, searchParams],
  );

  if (hide) return null;

  return <MobileTabBar active={active} onSelect={onSelect} />;
}

export function MobileTabBarGlobal() {
  return (
    <Suspense fallback={null}>
      <MobileTabBarGlobalInner />
    </Suspense>
  );
}
