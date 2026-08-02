import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
      },
    });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const [agg, reviews, activeItems] = await Promise.all([
      this.prisma.review.aggregate({
        where: { ratedUserId: id },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      this.prisma.review.findMany({
        where: { ratedUserId: id },
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          rater: { select: { id: true, name: true, avatarUrl: true } },
          order: {
            select: {
              item: { select: { id: true, title: true } },
            },
          },
        },
      }),
      this.prisma.item.findMany({
        where: { userId: id, status: { in: ['ATIVO', 'NEGOCIANDO'] } },
        orderBy: { createdAt: 'desc' },
        take: 24,
        include: {
          user: { select: { id: true, name: true } },
        },
      }),
    ]);

    return {
      user,
      ratingAvg: agg._avg.rating ? Number(agg._avg.rating.toFixed(1)) : null,
      ratingCount: agg._count.rating,
      reviews,
      activeItems,
    };
  }
}
