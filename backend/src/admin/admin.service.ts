import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Category, UserRole } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { PromoteAdminDto } from './dto/promote-admin.dto';
import { UpdateSupportTicketDto } from './dto/update-support-ticket.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [
      users,
      activeItems,
      donations,
      negotiating,
      concluded,
      openTickets,
      activeWithCategories,
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
      this.prisma.item.findMany({
        where: { status: 'ATIVO' },
        select: { categories: true },
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

    return {
      users,
      activeItems,
      donations,
      negotiating,
      concluded,
      openTickets,
      byCategory,
    };
  }

  async listUsers(params: {
    page?: number;
    limit?: number;
    role?: UserRole;
    email?: string;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const where = {
      ...(params.role ? { role: params.role } : {}),
      ...(params.email
        ? { email: { contains: params.email.trim().toLowerCase(), mode: 'insensitive' as const } }
        : {}),
    };

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          createdAt: true,
        },
      }),
    ]);

    return { total, page, limit, users };
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
          select: { id: true, name: true, email: true },
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

    return this.prisma.supportTicket.update({
      where: { id },
      data: {
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.adminReply !== undefined ? { adminReply: dto.adminReply } : {}),
        assignedAdminId: adminId,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        assignedAdmin: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }
}
