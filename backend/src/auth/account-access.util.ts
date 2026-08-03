import { UnauthorizedException } from '@nestjs/common';
import type { AccountStatus } from '../generated/prisma/enums';

type AccountGateUser = {
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

export function assertAccountAllowed(user: AccountGateUser): void {
  if (user.accountStatus === 'BANNED') {
    throw new UnauthorizedException(
      user.moderationReason?.trim()
        ? `Sua conta foi banida: ${user.moderationReason.trim()}`
        : 'Sua conta foi banida permanentemente. Entre em contato com o suporte.',
    );
  }

  if (user.accountStatus === 'SUSPENDED') {
    if (isSuspensionExpired(user)) return;
    const until = user.suspendedUntil
      ? ` até ${user.suspendedUntil.toLocaleString('pt-BR')}`
      : '';
    const reason = user.moderationReason?.trim()
      ? ` Motivo: ${user.moderationReason.trim()}`
      : '';
    throw new UnauthorizedException(
      `Sua conta está suspensa${until}.${reason}`,
    );
  }
}
