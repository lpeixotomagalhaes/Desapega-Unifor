"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { NONCE_KEY, RETURN_KEY } from "@/components/GoogleSignInButton";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

function parseIdTokenPayload(idToken: string): { nonce?: string } | null {
  try {
    const payload = idToken.split(".")[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as { nonce?: string };
  } catch {
    return null;
  }
}

function GoogleCallbackInner() {
  const { signIn } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : "";
      const query = window.location.search.startsWith("?")
        ? window.location.search.slice(1)
        : "";
      const params = new URLSearchParams(hash || query);

      const oauthError = params.get("error");
      if (oauthError) {
        setError(
          oauthError === "access_denied"
            ? "Login com Google cancelado."
            : `Google retornou um erro: ${oauthError}`,
        );
        return;
      }

      const idToken = params.get("id_token");
      if (!idToken) {
        setError(
          "Não recebemos o token do Google. Confira se a URI de redirecionamento está autorizada no Google Cloud Console: /auth/google/callback",
        );
        return;
      }

      const expectedNonce = sessionStorage.getItem(NONCE_KEY);
      const payload = parseIdTokenPayload(idToken);
      if (expectedNonce && payload?.nonce && payload.nonce !== expectedNonce) {
        setError("Falha de segurança no login Google (nonce inválido). Tente de novo.");
        return;
      }

      const returnUrl = sessionStorage.getItem(RETURN_KEY) || "/";
      sessionStorage.removeItem(NONCE_KEY);
      sessionStorage.removeItem(RETURN_KEY);

      try {
        const auth = await api.loginWithGoogle(idToken);
        signIn(auth);
        window.location.replace(returnUrl);
      } catch (err) {
        setError(
          err instanceof ApiError
            ? err.message
            : "Não foi possível concluir o login com Google.",
        );
      }
    };

    void run();
  }, [signIn]);

  if (error) {
    return (
      <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border border-fog bg-white p-8 text-center shadow-lg">
        <BrandLogo mark="blue" height={40} />
        <p className="text-sm text-red-700">{error}</p>
        <Link
          href="/login"
          className="rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand"
        >
          Voltar ao login
        </Link>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-3 rounded-2xl border border-fog bg-white p-8 text-center shadow-lg">
      <BrandLogo mark="blue" height={40} />
      <p className="text-sm font-medium text-navy">Conectando com o Google…</p>
      <p className="text-xs text-muted">Aguarde um instante.</p>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-mist px-4">
      <Suspense
        fallback={
          <p className="text-sm text-muted">Carregando…</p>
        }
      >
        <GoogleCallbackInner />
      </Suspense>
    </div>
  );
}
