"use client";

import { useOfflineQueue } from "@/lib/offlineQueue";

/** Slim banner: offline status and/or pending publish count. Must be under OfflineQueueProvider. */
export function OfflineStatusBanner() {
  const { isOnline, pendingCount } = useOfflineQueue();

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

  return (
    <div
      role="status"
      className="border-b border-emerald-200 bg-emerald-50 px-4 py-2.5 text-center text-sm text-emerald-900"
    >
      Publicando {pendingCount} anúncio{pendingCount === 1 ? "" : "s"} da fila
      offline…
    </div>
  );
}
