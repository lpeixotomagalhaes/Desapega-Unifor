"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { isProfileIncomplete } from "@/components/CompleteProfileModal";
import { safeReturnUrl, useAuth, useAuthRedirect } from "@/lib/auth";

/**
 * Mantido por compatibilidade de links antigos.
 * O preenchimento real acontece no popup global (CompleteProfileGate).
 */
function CompletarPerfilInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token } = useAuth();
  const { ready } = useAuthRedirect();
  const returnUrl = safeReturnUrl(searchParams.get("returnUrl"));

  useEffect(() => {
    if (!ready || !token || !user) return;
    if (!isProfileIncomplete(user)) {
      router.replace(returnUrl);
      return;
    }
    // Perfil incompleto: vai ao destino e o modal global bloqueia até preencher.
    router.replace(returnUrl);
  }, [ready, token, user, router, returnUrl]);

  return (
    <div className="hero-glow flex min-h-full flex-1 flex-col items-center justify-center px-4 py-10">
      <BrandLogo variant="horizontal" height={44} priority />
      <p className="mt-6 text-sm text-white/90">Abrindo formulário do perfil…</p>
    </div>
  );
}

export default function CompletarPerfilPage() {
  return (
    <Suspense>
      <CompletarPerfilInner />
    </Suspense>
  );
}
