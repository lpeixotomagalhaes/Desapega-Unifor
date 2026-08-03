"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback } from "react";
import { MobileTabBar, type MobileTabId } from "@/components/MobileTabBar";
import { useAuth } from "@/lib/auth";
import { useMobileChrome } from "@/lib/mobile-chrome";

function MobileTabBarGlobalInner() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { menuOpen, supportOpen, openMenu, openSupport } = useMobileChrome();

  const hide =
    pathname.startsWith("/login") ||
    pathname.startsWith("/registro") ||
    pathname.startsWith("/completar-perfil") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/auth/");

  const onApp = pathname === "/app" || pathname.startsWith("/app/");
  const appTab = searchParams.get("tab");

  let active: MobileTabId | null = null;
  if (menuOpen) active = "menu";
  else if (supportOpen) active = "suporte";
  else if (pathname === "/") active = "inicio";
  else if (onApp && appTab === "anunciar") active = "anunciar";
  else if (onApp) active = "buscar";

  const onSelect = useCallback(
    (tab: MobileTabId) => {
      if (tab === "inicio") {
        router.push("/");
        return;
      }
      if (tab === "buscar") {
        router.push("/app");
        return;
      }
      if (tab === "anunciar") {
        if (!user) {
          router.push(
            `/login?returnUrl=${encodeURIComponent("/app?tab=anunciar")}`,
          );
          return;
        }
        router.push("/app?tab=anunciar");
        return;
      }
      if (tab === "suporte") {
        if (!user) {
          router.push(
            `/login?returnUrl=${encodeURIComponent(pathname || "/app")}`,
          );
          return;
        }
        openSupport();
        return;
      }
      if (tab === "menu") {
        if (!user) {
          router.push("/login");
          return;
        }
        openMenu();
      }
    },
    [openMenu, openSupport, pathname, router, user],
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
