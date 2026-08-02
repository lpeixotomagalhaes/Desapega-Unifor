import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(raterId: string, dto: CreateReviewDto) {
    const order = await this.prisma.itemInterest.findUnique({
      where: { id: dto.orderId },
      include: {
        item: {
          select: { id: true, title: true, userId: true },
        },
        review: { select: { id: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado.');
    }
    if (order.buyerId !== raterId) {
      throw new ForbiddenException(
        'Só o comprador pode avaliar este pedido.',
      );
    }
    if (order.status !== 'ENTREGUE') {
      throw new BadRequestException(
        'Só é possível avaliar após a entrega do pedido.',
      );
    }
    if (order.review) {
      throw new ConflictException('Este pedido já foi avaliado.');
    }

    const sellerId = order.item.userId;
    const comment = dto.comment?.trim() || null;

    const review = await this.prisma.review.create({
      data: {
        orderId: order.id,
        raterId,
        ratedUserId: sellerId,
        rating: dto.rating,
        comment,
      },
      include: {
        rater: { select: { id: true, name: true, avatarUrl: true } },
        ratedUser: { select: { id: true, name: true } },
        order: {
          select: {
            id: true,
            item: { select: { id: true, title: true, imageUrl: true } },
          },
        },
      },
    });

    await this.notifications.create(
      sellerId,
      'NEW_REVIEW',
      'Nova avaliação recebida',
      `${review.rater.name} avaliou você com ${dto.rating} estrela${dto.rating === 1 ? '' : 's'} em "${order.item.title}".`,
      order.item.id,
    );

    return review;
  }

  findPending(buyerId: string) {
    return this.prisma.itemInterest.findMany({
      where: {
        buyerId,
        status: 'ENTREGUE',
        review: null,
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        item: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
      },
    });
  }
}
