import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AccountStatus, UserRole } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from './auth.service';
import { isSuspensionExpired } from './account-access.util';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  accountStatus: AccountStatus;
  suspendedUntil: Date | null;
  moderationReason: string | null;
}

/** Atualiza lastSeenAt no máximo a cada 2 minutos por usuário. */
const LAST_SEEN_THROTTLE_MS = 2 * 60 * 1000;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        accountStatus: true,
        suspendedUntil: true,
        moderationReason: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }

    if (isSuspensionExpired(user)) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          accountStatus: 'ACTIVE',
          suspendedUntil: null,
          moderationReason: null,
          moderatedAt: null,
          moderatedById: null,
        },
      });
      user.accountStatus = 'ACTIVE';
      user.suspendedUntil = null;
      user.moderationReason = null;
    }

    // Banidos/suspensos podem autenticar e navegar; restrições ficam nas ações.
    void this.touchLastSeen(user.id);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      accountStatus: user.accountStatus,
      suspendedUntil: user.suspendedUntil,
      moderationReason: user.moderationReason,
    };
  }

  private async touchLastSeen(userId: string) {
    try {
      const cutoff = new Date(Date.now() - LAST_SEEN_THROTTLE_MS);
      await this.prisma.user.updateMany({
        where: {
          id: userId,
          OR: [{ lastSeenAt: null }, { lastSeenAt: { lt: cutoff } }],
        },
        data: { lastSeenAt: new Date() },
      });
    } catch {
      // presença é best-effort; não bloqueia auth
    }
  }
}
