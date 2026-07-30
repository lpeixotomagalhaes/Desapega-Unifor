import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [activeItems, donations, soldItems, users] = await Promise.all([
      this.prisma.item.count({ where: { status: 'ATIVO' } }),
      this.prisma.item.count({ where: { isDonation: true } }),
      this.prisma.item.count({ where: { status: 'CONCLUIDO' } }),
      this.prisma.user.count(),
    ]);

    return { activeItems, donations, soldItems, users };
  }
}
