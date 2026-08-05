"use client";

import { useEffect, useState } from "react";
import { useOfflineQueue } from "@/lib/offlineQueue";

/** Slim banner: offline status and/or pending publish count. Must be under OfflineQueueProvider. */
export function OfflineStatusBanner() {
  const { isOnline, pendingItems, pendingCount } = useOfflineQueue();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Evita mismatch SSR/cliente (navigator.onLine / fila IndexedDB só existem no browser)
  if (!mounted) return null;

  if (isOnline && pendingCount === 0) return null;

  if (!isOnline) {
    return (
      <div
        role="status"
        className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-sm text-amber-950"
      >
        <span className="font-semibold">Você está offline</span>
        {pendingCount > 0 ? (
          <>
            {" "}
            · {pendingCount} anúncio{pendingCount === 1 ? "" : "s"} carregado
            {pendingCount === 1 ? "" : "s"}, aguardando conexão para publicar
          </>
        ) : (
          <> · algumas funções ficam limitadas até reconectar</>
        )}
      </div>
    );
  }

  const errorCount = pendingItems.filter((i) => i.status === "error").length;
  const activeCount = pendingCount - errorCount;

  if (activeCount === 0 && errorCount > 0) {
    return (
      <div
        role="status"
        className="border-b border-red-200 bg-red-50 px-4 py-2.5 text-center text-sm text-red-800"
      >
        {errorCount} anúncio{errorCount === 1 ? "" : "s"} da fila offline{" "}
        {errorCount === 1 ? "falhou" : "falharam"} ao publicar — veja em Meus
        anúncios.
      </div>
    );
  }

  return (
    <div
      role="status"
      className="border-b border-emerald-200 bg-emerald-50 px-4 py-2.5 text-center text-sm text-emerald-900"
    >
      Publicando {activeCount} anúncio{activeCount === 1 ? "" : "s"} da fila
      offline…
      {errorCount > 0 ? ` (${errorCount} com falha)` : ""}
    </div>
  );
}
