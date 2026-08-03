"use client";

import { isMarketplaceRestricted, type SessionUser } from "@/lib/api";

export function AccountRestrictionBanner({
  user,
}: {
  user: SessionUser | null | undefined;
}) {
  if (!isMarketplaceRestricted(user)) return null;

  const banned = user?.accountStatus === "BANNED";
  const until = user?.suspendedUntil
    ? new Date(user.suspendedUntil).toLocaleString("pt-BR")
    : null;
  const reason = user?.moderationReason?.trim();

  return (
    <div
      className={`border-b px-4 py-2.5 text-sm ${
        banned
          ? "border-red-200 bg-red-50 text-red-900"
          : "border-amber-200 bg-amber-50 text-amber-950"
      }`}
      role="status"
    >
      <div className="mx-auto max-w-7xl">
        <p>
          {banned ? (
            <>
              Sua conta está <strong>banida</strong>. Você pode navegar, mas não
              pode anunciar nem negociar.
            </>
          ) : (
            <>
              Sua conta está <strong>suspensa</strong>
              {until ? ` até ${until}` : ""}. Você pode navegar, mas não pode
              anunciar nem negociar.
            </>
          )}
          {reason ? (
            <span className="mt-0.5 block text-xs opacity-90">
              Motivo: {reason}
            </span>
          ) : null}
        </p>
      </div>
    </div>
  );
}
