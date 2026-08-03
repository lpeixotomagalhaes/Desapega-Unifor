import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Category, UserRole } from '../generated/prisma/enums';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { AdminTakeDownItemDto } from './dto/admin-take-down-item.dto';
import { AuditService } from './audit.service';
import {
  ModerateUserAction,
  ModerateUserDto,
} from './dto/moderate-user.dto';
import { PromoteAdminDto } from './dto/promote-admin.dto';
import { UpdateSupportTicketDto } from './dto/update-support-ticket.dto';

const USER_MODERATION_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  course: true,
  enrollment: true,
  accountStatus: true,
  suspendedUntil: true,
  moderationReason: true,
  moderatedAt: true,
  createdAt: true,
  _count: { select: { items: true, supportTickets: true } },
} as const;

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
  ) {}

  async getStats() {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - 29);

    const [
      users,
      activeItems,
      donations,
      negotiating,
      concluded,
      openTickets,
      bannedUsers,
      suspendedUsers,
      activeWithCategories,
      salesTotal,
      donationsConcluded,
      pendingOrders,
      negotiatingOrders,
      deliveredOrders,
      recentUsers,
      recentConcluded,
      recentItems,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.item.count({ where: { status: 'ATIVO' } }),
      this.prisma.item.count({
        where: { isDonation: true, status: 'ATIVO' },
      }),
      this.prisma.item.count({ where: { status: 'NEGOCIANDO' } }),
      this.prisma.item.count({ where: { status: 'CONCLUIDO' } }),
      this.prisma.supportTicket.count({
        where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
      }),
      this.prisma.user.count({ where: { accountStatus: 'BANNED' } }),
      this.prisma.user.count({ where: { accountStatus: 'SUSPENDED' } }),
      this.prisma.item.findMany({
        where: { status: 'ATIVO' },
        select: { categories: true },
      }),
      this.prisma.item.count({
        where: { status: 'CONCLUIDO', isDonation: false },
      }),
      this.prisma.item.count({
        where: { status: 'CONCLUIDO', isDonation: true },
      }),
      this.prisma.itemInterest.count({ where: { status: 'PENDENTE' } }),
      this.prisma.itemInterest.count({ where: { status: 'NEGOCIANDO' } }),
      this.prisma.itemInterest.count({ where: { status: 'ENTREGUE' } }),
      this.prisma.user.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
      }),
      this.prisma.item.findMany({
        where: { status: 'CONCLUIDO', updatedAt: { gte: since } },
        select: { updatedAt: true, isDonation: true },
      }),
      this.prisma.item.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
      }),
    ]);

    const categoryCounts = new Map<string, number>();
    for (const item of activeWithCategories) {
      for (const category of item.categories) {
        categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
      }
    }

    const byCategory = Object.values(Category).map((category) => ({
      category,
      count: categoryCounts.get(category) ?? 0,
    }));

    const dayKey = (d: Date) => d.toISOString().slice(0, 10);
    const seriesMap = new Map<
      string,
      { date: string; sales: number; donations: number; newUsers: number; newItems: number }
    >();
    for (let i = 0; i < 30; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      const key = dayKey(d);
      seriesMap.set(key, {
        date: key,
        sales: 0,
        donations: 0,
        newUsers: 0,
        newItems: 0,
      });
    }
    for (const u of recentUsers) {
      const key = dayKey(u.createdAt);
      const row = seriesMap.get(key);
      if (row) row.newUsers += 1;
    }
    for (const item of recentItems) {
      const key = dayKey(item.createdAt);
      const row = seriesMap.get(key);
      if (row) row.newItems += 1;
    }
    for (const item of recentConcluded) {
      const key = dayKey(item.updatedAt);
      const row = seriesMap.get(key);
      if (!row) continue;
      if (item.isDonation) row.donations += 1;
      else row.sales += 1;
    }

    return {
      users,
      activeItems,
      donations,
      negotiating,
      concluded,
      openTickets,
      bannedUsers,
      suspendedUsers,
      byCategory,
      salesTotal,
      donationsConcluded,
      ordersByStatus: {
        PENDENTE: pendingOrders,
        NEGOCIANDO: negotiatingOrders,
        ENTREGUE: deliveredOrders,
      },
      trends: Array.from(seriesMap.values()),
    };
  }

  async listUsers(params: {
    page?: number;
    limit?: number;
    role?: UserRole;
    email?: string;
    accountStatus?: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
  }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const where = {
      ...(params.role ? { role: params.role } : {}),
      ...(params.accountStatus
        ? { accountStatus: params.accountStatus }
        : {}),
      ...(params.email
        ? {
            email: {
              contains: params.email.trim().toLowerCase(),
              mode: 'insensitive' as const,
            },
          }
        : {}),
    };

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: USER_MODERATION_SELECT,
      }),
    ]);

    return { total, page, limit, users };
  }

  async moderateUser(
    targetId: string,
    adminId: string,
    dto: ModerateUserDto,
  ) {
    const [target, admin] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: targetId } }),
      this.prisma.user.findUnique({
        where: { id: adminId },
        select: { id: true, role: true },
      }),
    ]);

    if (!target) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    if (!admin) {
      throw new ForbiddenException('Admin inválido.');
    }
    if (target.id === adminId) {
      throw new BadRequestException('Você não pode moderar a própria conta.');
    }
    if (target.role === 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Não é possível moderar um SUPER_ADMIN.',
      );
    }
    if (
      target.role === 'ADMIN' &&
      admin.role !== 'SUPER_ADMIN'
    ) {
      throw new ForbiddenException(
        'Somente SUPER_ADMIN pode moderar outro ADMIN.',
      );
    }

    if (dto.action === ModerateUserAction.RESTORE) {
      const updated = await this.prisma.user.update({
        where: { id: targetId },
        data: {
          accountStatus: 'ACTIVE',
          suspendedUntil: null,
          moderationReason: null,
          moderatedAt: new Date(),
          moderatedById: adminId,
        },
        select: USER_MODERATION_SELECT,
      });

      await this.notifications.create(
        targetId,
        'ACCOUNT_MODERATION',
        'Conta reativada',
        'Sua conta no Desapega UNIFOR foi reativada. Você já pode usar a plataforma normalmente.',
      );

      await this.audit.create({
        actorId: adminId,
        action: 'USER_RESTORE',
        targetType: 'USER',
        targetId,
        summary: `Conta reativada: ${target.email}`,
        metadata: { email: target.email, previousStatus: target.accountStatus },
      });

      return updated;
    }

    const reason = dto.reason?.trim();
    if (!reason) {
      throw new BadRequestException('Informe o motivo da moderação.');
    }

    if (dto.action === ModerateUserAction.BAN) {
      const updated = await this.prisma.$transaction(async (tx) => {
        if (dto.takeDownItems !== false) {
          await tx.item.updateMany({
            where: {
              userId: targetId,
              status: { in: ['ATIVO', 'NEGOCIANDO'] },
            },
            data: {
              status: 'CONCLUIDO',
              negotiatingWithId: null,
            },
          });
        }

        return tx.user.update({
          where: { id: targetId },
          data: {
            accountStatus: 'BANNED',
            suspendedUntil: null,
            moderationReason: reason,
            moderatedAt: new Date(),
            moderatedById: adminId,
          },
          select: USER_MODERATION_SELECT,
        });
      });

      await this.notifications.create(
        targetId,
        'ACCOUNT_MODERATION',
        'Conta banida',
        `Sua conta foi banida permanentemente. Motivo: ${reason}`,
      );

      await this.audit.create({
        actorId: adminId,
        action: 'USER_BAN',
        targetType: 'USER',
        targetId,
        summary: `Conta banida: ${target.email}`,
        metadata: {
          email: target.email,
          reason,
          takeDownItems: dto.takeDownItems !== false,
        },
      });

      return updated;
    }

    // SUSPEND
    const days = dto.days;
    if (!days || days < 1) {
      throw new BadRequestException(
        'Informe quantos dias de suspensão (1 a 365).',
      );
    }

    const suspendedUntil = new Date();
    suspendedUntil.setDate(suspendedUntil.getDate() + days);

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.takeDownItems) {
        await tx.item.updateMany({
          where: {
            userId: targetId,
            status: { in: ['ATIVO', 'NEGOCIANDO'] },
          },
          data: {
            status: 'CONCLUIDO',
            negotiatingWithId: null,
          },
        });
      }

      return tx.user.update({
        where: { id: targetId },
        data: {
          accountStatus: 'SUSPENDED',
          suspendedUntil,
          moderationReason: reason,
          moderatedAt: new Date(),
          moderatedById: adminId,
        },
        select: USER_MODERATION_SELECT,
      });
    });

    await this.notifications.create(
      targetId,
      'ACCOUNT_MODERATION',
      'Conta suspensa',
      `Sua conta foi suspensa até ${suspendedUntil.toLocaleString('pt-BR')}. Motivo: ${reason}`,
    );

    await this.audit.create({
      actorId: adminId,
      action: 'USER_SUSPEND',
      targetType: 'USER',
      targetId,
      summary: `Conta suspensa (${days} dias): ${target.email}`,
      metadata: {
        email: target.email,
        reason,
        days,
        suspendedUntil: suspendedUntil.toISOString(),
        takeDownItems: !!dto.takeDownItems,
      },
    });

    return updated;
  }

  async listItems(params: {
    page?: number;
    limit?: number;
    status?: 'ATIVO' | 'NEGOCIANDO' | 'CONCLUIDO';
    search?: string;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const search = params.search?.trim();
    const where = {
      ...(params.status ? { status: params.status } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' as const } },
              {
                user: {
                  email: { contains: search, mode: 'insensitive' as const },
                },
              },
              {
                user: {
                  name: { contains: search, mode: 'insensitive' as const },
                },
              },
            ],
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      this.prisma.item.count({ where }),
      this.prisma.item.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              accountStatus: true,
            },
          },
        },
      }),
    ]);

    return {
      total,
      page,
      limit,
      items: JSON.parse(JSON.stringify(items)) as typeof items,
    };
  }

  async takeDownItem(
    itemId: string,
    adminId: string,
    dto: AdminTakeDownItemDto,
  ) {
    const item = await this.prisma.item.findUnique({
      where: { id: itemId },
      include: { user: { select: { id: true, name: true } } },
    });
    if (!item) {
      throw new NotFoundException('Anúncio não encontrado.');
    }

    const reason =
      dto.reason?.trim() ||
      'Anúncio removido pela moderação por violar as regras da plataforma.';

    const updated = await this.prisma.item.update({
      where: { id: itemId },
      data: {
        status: 'CONCLUIDO',
        negotiatingWithId: null,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    await this.notifications.create(
      item.userId,
      'ITEM_STATUS_CHANGED',
      'Anúncio removido pela moderação',
      `"${item.title}" foi removido do feed. ${reason}`,
      item.id,
    );

    await this.audit.create({
      actorId: adminId,
      action: 'ITEM_TAKE_DOWN',
      targetType: 'ITEM',
      targetId: itemId,
      summary: `Anúncio removido: "${item.title}"`,
      metadata: {
        reason,
        ownerId: item.userId,
        ownerName: item.user.name,
      },
    });

    return updated;
  }

  async deleteItem(
    itemId: string,
    adminId: string,
    dto: AdminTakeDownItemDto,
  ) {
    const item = await this.prisma.item.findUnique({
      where: { id: itemId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    if (!item) {
      throw new NotFoundException('Anúncio não encontrado.');
    }

    const reason =
      dto.reason?.trim() ||
      'Anúncio excluído pela moderação.';

    await this.prisma.item.delete({ where: { id: itemId } });

    await this.notifications.create(
      item.userId,
      'ITEM_STATUS_CHANGED',
      'Anúncio excluído pela moderação',
      `"${item.title}" foi excluído permanentemente. ${reason}`,
    );

    await this.audit.create({
      actorId: adminId,
      action: 'ITEM_DELETE',
      targetType: 'ITEM',
      targetId: itemId,
      summary: `Anúncio excluído: "${item.title}"`,
      metadata: {
        reason,
        ownerId: item.userId,
        ownerName: item.user.name,
        ownerEmail: item.user.email,
      },
    });

    return { deleted: true, id: itemId, title: item.title };
  }

  async listAdmins() {
    return this.prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
      orderBy: [{ role: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async promoteAdmin(dto: PromoteAdminDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('Nenhum usuário encontrado com esse e-mail.');
    }
    if (user.role === 'SUPER_ADMIN') {
      throw new BadRequestException('Este usuário já é SUPER_ADMIN.');
    }
    if (user.role === 'ADMIN') {
      throw new BadRequestException('Este usuário já é ADMIN.');
    }
    if (user.accountStatus !== 'ACTIVE') {
      throw new BadRequestException(
        'Não é possível promover uma conta banida ou suspensa.',
      );
    }

    return this.prisma.user.update({
      where: { id: user.id },
      data: { role: 'ADMIN' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async revokeAdmin(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    if (user.role === 'SUPER_ADMIN') {
      throw new ForbiddenException('Não é possível revogar um SUPER_ADMIN.');
    }
    if (user.role !== 'ADMIN') {
      throw new BadRequestException('Este usuário não é ADMIN.');
    }

    return this.prisma.user.update({
      where: { id },
      data: { role: 'USER' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async listTickets(status?: string) {
    return this.prisma.supportTicket.findMany({
      where: status
        ? {
            status: status as
              | 'OPEN'
              | 'IN_PROGRESS'
              | 'RESOLVED'
              | 'CLOSED',
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            accountStatus: true,
          },
        },
        assignedAdmin: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async updateTicket(
    id: string,
    adminId: string,
    dto: UpdateSupportTicketDto,
  ) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
    });
    if (!ticket) {
      throw new NotFoundException('Ticket não encontrado.');
    }

    const updated = await this.prisma.supportTicket.update({
      where: { id },
      data: {
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.adminReply !== undefined ? { adminReply: dto.adminReply } : {}),
        assignedAdminId: adminId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            accountStatus: true,
          },
        },
        assignedAdmin: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (dto.adminReply?.trim()) {
      await this.notifications.create(
        ticket.userId,
        'SUPPORT_REPLY',
        'Resposta do suporte',
        `Sobre "${ticket.subject}": ${dto.adminReply.trim().slice(0, 180)}`,
      );
    }

    await this.audit.create({
      actorId: adminId,
      action: 'SUPPORT_UPDATE',
      targetType: 'SUPPORT_TICKET',
      targetId: id,
      summary: `Ticket atualizado: "${ticket.subject}"`,
      metadata: {
        status: dto.status ?? ticket.status,
        replied: Boolean(dto.adminReply?.trim()),
        userId: ticket.userId,
      },
    });

    return updated;
  }
}
