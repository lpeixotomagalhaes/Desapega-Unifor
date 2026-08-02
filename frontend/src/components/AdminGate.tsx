"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { isAdmin } from "@/lib/api";
import { useAuth } from "@/lib/auth";

/** Bloqueia /dashboard* para quem não for ADMIN/SUPER_ADMIN. */
export function AdminGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user || !isAdmin(user)) {
      router.replace("/admin");
    }
  }, [loading, user, router, pathname]);

  if (loading || !user || !isAdmin(user)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-navy-deep text-sm text-white/70">
        Verificando acesso…
      </div>
    );
  }

  return <>{children}</>;
}
