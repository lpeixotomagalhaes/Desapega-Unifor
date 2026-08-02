"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { postAuthDestination } from "@/lib/auth";

const NONCE_KEY = "desapega.google.nonce";
const RETURN_KEY = "desapega.google.returnUrl";

type GoogleSignInButtonProps = {
  onError: (message: string) => void;
};

/**
 * Login Google via redirect OAuth (sem popup).
 * Evita bloqueio de pop-up do browser e o erro GSI_LOGGER.
 *
 * No Google Cloud Console, em Credenciais → OAuth 2.0:
 * - Origens JavaScript autorizadas: http://localhost:3000 (e o domínio de prod)
 * - URIs de redirecionamento autorizados: http://localhost:3000/auth/google/callback
 */
export function GoogleSignInButton({ onError }: GoogleSignInButtonProps) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const searchParams = useSearchParams();
  const [busy, setBusy] = useState(false);

  if (!clientId) {
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs text-amber-800">
        Login com Google ainda não configurado. Preencha{" "}
        <code className="font-mono">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> no{" "}
        <code className="font-mono">frontend/.env.local</code> e{" "}
        <code className="font-mono">GOOGLE_CLIENT_ID</code> no{" "}
        <code className="font-mono">backend/.env</code> (mesmo valor), depois
        reinicie o frontend e o backend.
      </p>
    );
  }

  const startGoogleLogin = () => {
    try {
      setBusy(true);
      const nonce =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const returnUrlParam = searchParams.get("returnUrl");
      const destination = postAuthDestination(returnUrlParam);

      sessionStorage.setItem(NONCE_KEY, nonce);
      sessionStorage.setItem(RETURN_KEY, destination);

      const redirectUri = `${window.location.origin}/auth/google/callback`;
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "id_token",
        scope: "openid email profile",
        nonce,
        prompt: "select_account",
      });

      window.location.assign(
        `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
      );
    } catch {
      setBusy(false);
      onError("Não foi possível iniciar o login com Google.");
    }
  };

  return (
    <button
      type="button"
      onClick={startGoogleLogin}
      disabled={busy}
      className="flex w-full items-center justify-center gap-3 rounded-full border border-[#c5d5e8] bg-white px-4 py-2.5 text-sm font-semibold text-navy shadow-sm transition-soft hover:border-brand hover:bg-mist disabled:cursor-wait disabled:opacity-70"
    >
      <GoogleGlyph className="h-5 w-5 shrink-0" />
      {busy ? "Redirecionando…" : "Continuar com o Google"}
    </button>
  );
}

export { NONCE_KEY, RETURN_KEY };

function GoogleGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
