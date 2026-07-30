"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError, type AuthResponse } from "@/lib/api";

interface GoogleCredentialResponse {
  credential: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, unknown>,
          ) => void;
        };
      };
    };
  }
}

type GoogleSignInButtonProps = {
  onSuccess: (auth: AuthResponse) => void;
  onError: (message: string) => void;
};

/**
 * Botão "Continuar com o Google" via Google Identity Services (GIS).
 * Não renderiza nada se NEXT_PUBLIC_GOOGLE_CLIENT_ID não estiver configurado
 * (ex: ambiente de dev sem Client ID ainda criado no Google Cloud Console).
 */
export function GoogleSignInButton({
  onSuccess,
  onError,
}: GoogleSignInButtonProps) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);

  const handleCredential = useCallback(
    async (response: GoogleCredentialResponse) => {
      try {
        const auth = await api.loginWithGoogle(response.credential);
        onSuccess(auth);
      } catch (err) {
        onError(
          err instanceof ApiError
            ? err.message
            : "Não foi possível entrar com o Google.",
        );
      }
    },
    [onSuccess, onError],
  );

  useEffect(() => {
    if (!scriptReady || !clientId || !containerRef.current || !window.google) {
      return;
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredential,
    });

    containerRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(containerRef.current, {
      theme: "outline",
      size: "large",
      shape: "pill",
      width: 320,
      text: "continue_with",
      locale: "pt-BR",
    });
  }, [scriptReady, clientId, handleCredential]);

  if (!clientId) return null;

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      <div
        ref={containerRef}
        className="flex w-full justify-center"
        aria-label="Continuar com o Google"
      />
    </>
  );
}
