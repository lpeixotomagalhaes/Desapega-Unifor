"use client";

import { useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useAuth, useAuthRedirect } from "@/lib/auth";

/** Compatibilidade: /conta redireciona para o perfil com edição. */
function ContaRedirectInner() {
  const router = useRouter();
  const { user } = useAuth();
  const { ready } = useAuthRedirect();

  useEffect(() => {
    if (!ready || !user) return;
    router.replace(`/perfil/${user.id}?edit=1`);
  }, [ready, user, router]);

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16 text-sm text-muted">
      Abrindo seu perfil…
    </div>
  );
}

export default function ContaPage() {
  return (
    <Suspense>
      <ContaRedirectInner />
    </Suspense>
  );
}
