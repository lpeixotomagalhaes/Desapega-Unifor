import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { buildWhatsAppUrl } from '../common/phone.util';
import type { Prisma } from '../generated/prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItemDto } from './dto/create-item.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { QueryItemsDto } from './dto/query-items.dto';
import { UpdateItemStatusDto } from './dto/update-item-status.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import type { OrderStatus } from '../generated/prisma/enums';

const itemWithOwner = {
  include: {
    user: { select: { id: true, name: true } },
  },
} satisfies Prisma.ItemDefaultArgs;

const STATUS_MESSAGES: Record<string, string> = {
  NEGOCIANDO: 'Este anúncio entrou em negociação com outro interessado.',
  CONCLUIDO: 'Este anúncio foi concluído e não está mais disponível.',
  ATIVO: 'Este anúncio voltou a ficar disponível.',
};

@Injectable()
export class ItemsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async findAll(query: QueryItemsDto) {
    const where: Prisma.ItemWhereInput = {
      status: { in: ['ATIVO', 'NEGOCIANDO'] },
    };

    if (query.category) {
      where.categories = { has: query.category };
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const items = await this.prisma.item.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      ...itemWithOwner,
    });

    // Garante JSON seguro (Decimal do Prisma) no Render/Express
    return JSON.parse(JSON.stringify(items)) as typeof items;
  }

  findMine(userId: string) {
    return this.prisma.item.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      ...itemWithOwner,
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.item.findUnique({
      where: { id },
      ...itemWithOwner,
    });
    if (!item) {
      throw new NotFoundException('Anúncio não encontrado.');
    }
    return item;
  }

  async create(userId: string, dto: CreateItemDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.phone) {
      throw new BadRequestException(
        'Complete seu perfil com um WhatsApp antes de anunciar.',
      );
    }

    const isDonation = dto.isDonation ?? false;

    if (!isDonation && dto.price == null) {
      throw new BadRequestException(
        'Informe um preço ou marque o item como doação.',
      );
    }

    return this.prisma.item.create({
      data: {
        title: dto.title,
        description: dto.description,
        categories: dto.categories,
        // Item doado não tem preço, mesmo que um valor tenha sido enviado
        price: isDonation ? null : dto.price,
        isDonation,
        imageUrl: dto.imageUrl,
        userId,
      },
      ...itemWithOwner,
    });
  }

  async updateStatus(userId: string, id: string, dto: UpdateItemStatusDto) {
    const item = await this.prisma.item.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('Anúncio não encontrado.');
    }
    if (item.userId !== userId) {
      throw new ForbiddenException(
        'Você só pode alterar seus próprios anúncios.',
      );
    }

    const previousStatus = item.status;
    const negotiatingWithId =
      dto.status === 'NEGOCIANDO' ? (dto.negotiatingWithId ?? null) : null;

    const updated = await this.prisma.item.update({
      where: { id },
      data: { status: dto.status, negotiatingWithId },
      ...itemWithOwner,
    });

    if (dto.status !== previousStatus) {
      const interestedBuyers = await this.prisma.itemInterest.findMany({
        where: { itemId: id, buyerId: { not: userId } },
        select: { buyerId: true },
      });
      const recipients = interestedBuyers
        .map((i) => i.buyerId)
        .filter((buyerId) => buyerId !== negotiatingWithId);

      if (recipients.length > 0) {
        await this.notifications.notifyMany(
          recipients,
          'ITEM_STATUS_CHANGED',
          `Atualização em "${item.title}"`,
          STATUS_MESSAGES[dto.status] ?? 'O status deste anúncio mudou.',
          id,
        );
      }
    }

    return updated;
  }

  async createOrder(buyerId: string, itemId: string, dto: CreateOrderDto) {
    const item = await this.prisma.item.findUnique({
      where: { id: itemId },
      include: { user: { select: { id: true, name: true, phone: true } } },
    });
    if (!item) {
      throw new NotFoundException('Anúncio não encontrado.');
    }
    if (item.userId === buyerId) {
      throw new BadRequestException(
        'Você não pode pedir o seu próprio anúncio.',
      );
    }
    if (item.status === 'CONCLUIDO') {
      throw new ConflictException('Este anúncio não está mais disponível.');
    }
    if (!item.user.phone) {
      throw new BadRequestException(
        'O vendedor ainda não configurou um WhatsApp de contato.',
      );
    }

    const campusBlock =
      dto.campusBlock === 'Outro' && dto.customBlock?.trim()
        ? dto.customBlock.trim()
        : dto.campusBlock.trim();

    const acceptListedPrice = item.isDonation ? true : dto.acceptListedPrice;
    let offeredPrice: number | null = null;
    if (!item.isDonation && !acceptListedPrice) {
      if (dto.offeredPrice == null) {
        throw new BadRequestException(
          'Informe o valor que está disposto a pagar, ou aceite o valor anunciado.',
        );
      }
      offeredPrice = dto.offeredPrice;
    }

    const orderData = {
      course: dto.course.trim(),
      enrollment: dto.enrollment.trim(),
      acceptListedPrice,
      offeredPrice,
      meetupDay: dto.meetupDay.trim(),
      meetupTime: dto.meetupTime.trim(),
      campusBlock,
      status: 'PENDENTE' as const,
    };

    const existing = await this.prisma.itemInterest.findUnique({
      where: { itemId_buyerId: { itemId, buyerId } },
    });

    const buyer = await this.prisma.user.findUnique({
      where: { id: buyerId },
      select: { name: true },
    });

    let order;
    if (existing) {
      if (existing.status === 'ENTREGUE') {
        throw new ConflictException(
          'Este pedido já foi concluído. Não é possível reenviar.',
        );
      }
      order = await this.prisma.itemInterest.update({
        where: { id: existing.id },
        data: orderData,
      });
    } else {
      order = await this.prisma.itemInterest.create({
        data: { itemId, buyerId, ...orderData },
      });
      await this.notifications.create(
        item.userId,
        'NEW_INTEREST',
        'Novo pedido no seu anúncio',
        `${buyer?.name ?? 'Alguém'} enviou um pedido para "${item.title}".`,
        itemId,
      );
    }

    const valueLine = item.isDonation
      ? 'Valor: doação'
      : acceptListedPrice
        ? `Valor: aceito o valor anunciado${
            item.price != null
              ? ` (${Number(item.price).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })})`
              : ''
          }`
        : `Valor disposto a pagar: ${Number(offeredPrice).toLocaleString(
            'pt-BR',
            { style: 'currency', currency: 'BRL' },
          )}`;

    const message = [
      `Oi! Vi seu anúncio "${item.title}" no Desapega UNIFOR.`,
      '',
      `Curso: ${orderData.course}`,
      `Matrícula: ${orderData.enrollment}`,
      valueLine,
      `Encontro: ${orderData.meetupDay} às ${orderData.meetupTime} — ${orderData.campusBlock}`,
    ].join('\n');

    return {
      order,
      whatsappUrl: buildWhatsAppUrl(item.user.phone, message),
    };
  }

  findMyInterests(userId: string) {
    return this.prisma.itemInterest.findMany({
      where: { item: { userId } },
      orderBy: { createdAt: 'desc' },
      include: {
        item: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            status: true,
            price: true,
            isDonation: true,
          },
        },
        buyer: { select: { id: true, name: true } },
      },
    });
  }

  /** Pedidos que o usuário (comprador) enviou em anúncios de outros. */
  findMyPurchases(buyerId: string) {
    return this.prisma.itemInterest.findMany({
      where: { buyerId },
      orderBy: { createdAt: 'desc' },
      include: {
        item: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        review: { select: { id: true, rating: true } },
      },
    });
  }

  async updateOrderStatus(
    sellerId: string,
    orderId: string,
    dto: UpdateOrderStatusDto,
  ) {
    const order = await this.prisma.itemInterest.findUnique({
      where: { id: orderId },
      include: {
        item: true,
        buyer: { select: { id: true, name: true } },
      },
    });
    if (!order) {
      throw new NotFoundException('Pedido não encontrado.');
    }
    if (order.item.userId !== sellerId) {
      throw new ForbiddenException(
        'Você só pode atualizar pedidos dos seus anúncios.',
      );
    }

    const next = dto.status as OrderStatus;
    const current = order.status;

    if (next === 'NEGOCIANDO') {
      if (current !== 'PENDENTE' && current !== 'NEGOCIANDO') {
        throw new BadRequestException(
          'Só é possível negociar um pedido pendente.',
        );
      }
      const [updatedOrder] = await this.prisma.$transaction([
        this.prisma.itemInterest.update({
          where: { id: orderId },
          data: { status: 'NEGOCIANDO' },
        }),
        this.prisma.item.update({
          where: { id: order.itemId },
          data: {
            status: 'NEGOCIANDO',
            negotiatingWithId: order.buyerId,
          },
        }),
      ]);

      if (current !== 'NEGOCIANDO') {
        const others = await this.prisma.itemInterest.findMany({
          where: {
            itemId: order.itemId,
            buyerId: { not: order.buyerId },
          },
          select: { buyerId: true },
        });
        if (others.length > 0) {
          await this.notifications.notifyMany(
            others.map((o) => o.buyerId),
            'ITEM_STATUS_CHANGED',
            `Atualização em "${order.item.title}"`,
            STATUS_MESSAGES.NEGOCIANDO,
            order.itemId,
          );
        }
      }

      return this.prisma.itemInterest.findUniqueOrThrow({
        where: { id: updatedOrder.id },
        include: {
          item: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
              status: true,
              price: true,
              isDonation: true,
            },
          },
          buyer: { select: { id: true, name: true } },
        },
      });
    }

    if (next === 'ENTREGUE') {
      if (current !== 'NEGOCIANDO') {
        throw new BadRequestException(
          'Confirme a negociação antes de marcar como entregue.',
        );
      }
      const [updatedOrder] = await this.prisma.$transaction([
        this.prisma.itemInterest.update({
          where: { id: orderId },
          data: { status: 'ENTREGUE' },
        }),
        this.prisma.item.update({
          where: { id: order.itemId },
          data: {
            status: 'CONCLUIDO',
            negotiatingWithId: order.buyerId,
          },
        }),
      ]);

      const others = await this.prisma.itemInterest.findMany({
        where: {
          itemId: order.itemId,
          buyerId: { not: order.buyerId },
        },
        select: { buyerId: true },
      });
      if (others.length > 0) {
        await this.notifications.notifyMany(
          others.map((o) => o.buyerId),
          'ITEM_STATUS_CHANGED',
          `Atualização em "${order.item.title}"`,
          STATUS_MESSAGES.CONCLUIDO,
          order.itemId,
        );
      }

      await this.notifications.create(
        order.buyerId,
        'REVIEW_REQUEST',
        'Avalie o vendedor',
        `O pedido de "${order.item.title}" foi entregue. Conte como foi a experiência.`,
        order.itemId,
      );

      return this.prisma.itemInterest.findUniqueOrThrow({
        where: { id: updatedOrder.id },
        include: {
          item: {
            select: {
              id: true,
              title: true,
              imageUrl: true,
              status: true,
              price: true,
              isDonation: true,
            },
          },
          buyer: { select: { id: true, name: true } },
        },
      });
    }

    if (next === 'PENDENTE') {
      throw new BadRequestException(
        'Não é possível voltar um pedido para pendente por esta rota.',
      );
    }

    throw new BadRequestException('Status de pedido inválido.');
  }

  async remove(userId: string, id: string) {
    const item = await this.prisma.item.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('Anúncio não encontrado.');
    }
    if (item.userId !== userId) {
      throw new ForbiddenException(
        'Você só pode remover seus próprios anúncios.',
      );
    }

    await this.prisma.item.delete({ where: { id } });
    return { deleted: true };
  }
}
