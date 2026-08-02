import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Considera online se esteve ativo nos últimos 5 minutos. */
const ONLINE_WINDOW_MS = 5 * 60 * 1000;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        bio: true,
        lastSeenAt: true,
        createdAt: true,
      },
    });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const [agg, reviews, activeItems, completedDeals] = await Promise.all([
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
      this.prisma.itemInterest.findMany({
        where: {
          status: 'ENTREGUE',
          item: { userId: id },
        },
        orderBy: { updatedAt: 'desc' },
        take: 40,
        select: {
          id: true,
          updatedAt: true,
          item: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
              isDonation: true,
              price: true,
              status: true,
            },
          },
          buyer: { select: { id: true, name: true } },
          review: {
            select: {
              id: true,
              rating: true,
              comment: true,
              createdAt: true,
            },
          },
        },
      }),
    ]);

    const online =
      !!user.lastSeenAt &&
      Date.now() - user.lastSeenAt.getTime() <= ONLINE_WINDOW_MS;

    const { lastSeenAt, ...publicUser } = user;

    return {
      user: publicUser,
      online,
      lastSeenAt,
      ratingAvg: agg._avg.rating ? Number(agg._avg.rating.toFixed(1)) : null,
      ratingCount: agg._count.rating,
      reviews,
      activeItems,
      completedDeals,
    };
  }
}
