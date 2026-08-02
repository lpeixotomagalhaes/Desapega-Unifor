import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { normalizeBrazilianPhone } from '../common/phone.util';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleLoginDto } from './dto/google-login.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import type { UserRole } from '../generated/prisma/enums';

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
}

const ME_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  avatarUrl: true,
  bio: true,
  role: true,
  onboardingCompletedAt: true,
  createdAt: true,
} as const;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly googleClient: OAuth2Client;
  private readonly googleClientId: string | undefined;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {
    this.googleClientId = this.config.get<string>('GOOGLE_CLIENT_ID')?.trim();
    this.googleClient = new OAuth2Client(this.googleClientId);
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Já existe uma conta com esse e-mail.');
    }

    const phone = normalizeBrazilianPhone(dto.phone);
    if (!phone) {
      throw new BadRequestException('Informe um WhatsApp válido, com DDD.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { name: dto.name, email: dto.email, passwordHash, phone },
    });

    return this.buildAuthResponse(user.id, true);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (
      !user ||
      !user.passwordHash ||
      !(await bcrypt.compare(dto.password, user.passwordHash))
    ) {
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    return this.buildAuthResponse(user.id, false);
  }

  async loginWithGoogle(dto: GoogleLoginDto) {
    const clientId = this.googleClientId;
    if (!clientId) {
      throw new BadRequestException(
        'Login com Google não está configurado no servidor.',
      );
    }

    let payload:
      | { sub?: string; email?: string; name?: string; picture?: string }
      | undefined;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: dto.idToken,
        audience: clientId,
      });
      payload = ticket.getPayload();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Google token verification failed: ${message}`);
      throw new UnauthorizedException('Token do Google inválido ou expirado.');
    }

    if (!payload?.sub || !payload.email) {
      throw new UnauthorizedException(
        'Não foi possível validar sua conta Google.',
      );
    }

    try {
      let user = await this.prisma.user.findUnique({
        where: { googleId: payload.sub },
      });
      let isNewUser = false;

      if (!user) {
        const byEmail = await this.prisma.user.findUnique({
          where: { email: payload.email },
        });

        if (byEmail) {
          user = await this.prisma.user.update({
            where: { id: byEmail.id },
            data: {
              googleId: payload.sub,
              avatarUrl: byEmail.avatarUrl ?? payload.picture ?? null,
            },
          });
        } else {
          user = await this.prisma.user.create({
            data: {
              name: payload.name ?? payload.email.split('@')[0],
              email: payload.email,
              googleId: payload.sub,
              avatarUrl: payload.picture ?? null,
            },
          });
          isNewUser = true;
        }
      }

      return await this.buildAuthResponse(user.id, isNewUser);
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Google login DB/JWT failed: ${message}`);
      if (
        /column .* does not exist|P2022|P2010|Unknown arg/i.test(message)
      ) {
        throw new BadRequestException(
          'Banco desatualizado para login Google (faltam colunas como role/bio). Rode o SQL de sync no Supabase.',
        );
      }
      throw new BadRequestException(
        'Não foi possível concluir o login com Google. Tente de novo.',
      );
    }
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: ME_SELECT,
    });
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }
    return user;
  }

  async updateMe(userId: string, dto: UpdateMeDto) {
    const data: {
      name?: string;
      phone?: string;
      avatarUrl?: string;
      bio?: string | null;
    } = {};
    if (dto.name) data.name = dto.name;
    if (dto.avatarUrl) data.avatarUrl = dto.avatarUrl;
    if (dto.bio !== undefined) {
      data.bio = dto.bio.trim() ? dto.bio.trim() : null;
    }
    if (dto.phone) {
      const phone = normalizeBrazilianPhone(dto.phone);
      if (!phone) {
        throw new BadRequestException('Informe um WhatsApp válido, com DDD.');
      }
      data.phone = phone;
    }

    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: ME_SELECT,
    });
  }

  completeOnboarding(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { onboardingCompletedAt: new Date() },
      select: ME_SELECT,
    });
  }

  async checkEmail(email: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    return { exists: Boolean(existing) };
  }

  private async buildAuthResponse(userId: string, isNewUser: boolean) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { lastSeenAt: new Date() },
      select: ME_SELECT,
    });
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    return {
      accessToken: this.jwtService.sign(payload),
      user,
      isNewUser,
    };
  }
}
