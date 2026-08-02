import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { UserRole } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtPayload } from './auth.service';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
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

  validate(payload: JwtPayload): AuthenticatedUser {
    void this.touchLastSeen(payload.sub);
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role ?? 'USER',
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
