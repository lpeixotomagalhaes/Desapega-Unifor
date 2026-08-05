import { ForbiddenException } from '@nestjs/common';
import type { AccountStatus } from '../generated/prisma/enums';

export type AccountGateUser = {
  accountStatus: AccountStatus;
  suspendedUntil: Date | null;
  moderationReason: string | null;
};

/** Retorna true se a suspensão expirou e a conta deve voltar a ACTIVE. */
export function isSuspensionExpired(user: AccountGateUser): boolean {
  return (
    user.accountStatus === 'SUSPENDED' &&
    !!user.suspendedUntil &&
    user.suspendedUntil.getTime() <= Date.now()
  );
}

/**
 * Banidos/suspensos podem entrar e navegar, mas não anunciar nem negociar.
 */
export function assertMarketplaceAllowed(user: AccountGateUser): void {
  if (user.accountStatus === 'BANNED') {
    throw new ForbiddenException(banMessage(user));
  }

  if (user.accountStatus === 'SUSPENDED') {
    if (isSuspensionExpired(user)) return;
    throw new ForbiddenException(suspendMessage(user));
  }
}

export function isMarketplaceRestricted(user: AccountGateUser): boolean {
  if (user.accountStatus === 'BANNED') return true;
  if (user.accountStatus === 'SUSPENDED' && !isSuspensionExpired(user)) {
    return true;
  }
  return false;
}

function banMessage(user: AccountGateUser): string {
  return user.moderationReason?.trim()
    ? `Sua conta está banida: ${user.moderationReason.trim()}. Você ainda pode navegar, mas não pode anunciar nem negociar.`
    : 'Sua conta está banida. Você ainda pode navegar, mas não pode anunciar nem negociar. Entre em contato com o suporte.';
}

function suspendMessage(user: AccountGateUser): string {
  const until = user.suspendedUntil
    ? ` até ${user.suspendedUntil.toLocaleString('pt-BR')}`
    : '';
  const reason = user.moderationReason?.trim()
    ? ` Motivo: ${user.moderationReason.trim()}.`
    : '';
  return `Sua conta está suspensa${until}.${reason} Você ainda pode navegar, mas não pode anunciar nem negociar.`;
}
