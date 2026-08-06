"use client";

import { useEffect } from "react";

/** Registra o SW e força a troca imediata quando há versão nova (v4+). */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;

    void navigator.serviceWorker
      .register("/sw.js")
      .then(async (registration) => {
        if (cancelled) return;
        // Pede update assim que carregar — garante que o SW antigo (que
        // interceptava a API e quebrava CORS) seja substituído rápido.
        await registration.update().catch(() => {});

        if (registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }

        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              // Nova versão instalada: ativa na próxima navegação.
              worker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });
      })
      .catch((err) => {
        console.error("Falha ao registrar Service Worker:", err);
      });

    const onControllerChange = () => {
      // Evita loop se já estamos recarregando por update.
    };
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
    };
  }, []);

  return null;
}
