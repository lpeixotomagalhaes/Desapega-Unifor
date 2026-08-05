import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  assertMarketplaceAllowed,
  isSuspensionExpired,
} from '../auth/account-access.util';
import { buildWhatsAppUrl } from '../common/phone.util';
import { normalizeMeetupDay } from '../common/meetup-day.util';
import { Prisma } from '../generated/prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
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
  SUSPENSO: 'Este anúncio foi suspenso pela moderação.',
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
      user: { accountStatus: 'ACTIVE' },
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
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    await this.ensureMarketplaceAccess(user);
    if (!user.phone) {
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

    const imageUrls =
      dto.imageUrls && dto.imageUrls.length > 0
        ? dto.imageUrls
        : [dto.imageUrl];
    const imageUrl = imageUrls[0] ?? dto.imageUrl;

    const item = await this.prisma.item.create({
      data: {
        title: dto.title,
        description: dto.description,
        categories: dto.categories,
        // Item doado não tem preço, mesmo que um valor tenha sido enviado
        price: isDonation ? null : dto.price,
        isDonation,
        imageUrl,
        imageUrls,
        userId,
      },
      ...itemWithOwner,
    });

    await this.notifications.create(
      userId,
      'ITEM_PUBLISHED',
      'Anúncio publicado com sucesso',
      `"${item.title}" já está visível para a comunidade do campus.`,
      item.id,
    );

    return item;
  }

  async updateStatus(userId: string, id: string, dto: UpdateItemStatusDto) {
    const actor = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!actor) throw new NotFoundException('Usuário não encontrado.');
    await this.ensureMarketplaceAccess(actor);

    const item = await this.prisma.item.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException('Anúncio não encontrado.');
    }
    if (item.userId !== userId) {
      throw new ForbiddenException(
        'Você só pode alterar seus próprios anúncios.',
      );
    }
    if (item.status === 'SUSPENSO') {
      throw new ForbiddenException(
        'Este anúncio está suspenso pela moderação e não pode ser alterado.',
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

    // Se o vendedor sair manualmente de NEGOCIANDO (ex.: voltou o anúncio a
    // ATIVO), o pedido correspondente não pode ficar "preso" em NEGOCIANDO —
    // volta para PENDENTE para refletir que a negociação não avançou.
    if (
      previousStatus === 'NEGOCIANDO' &&
      dto.status !== 'NEGOCIANDO' &&
      item.negotiatingWithId
    ) {
      await this.prisma.itemInterest.updateMany({
        where: {
          itemId: id,
          buyerId: item.negotiatingWithId,
          status: 'NEGOCIANDO',
        },
        data: { status: 'PENDENTE' },
      });
    }

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

      if (dto.status === 'CONCLUIDO') {
        await this.notifySavedWatchers(
          id,
          item.title,
          item.isDonation,
          negotiatingWithId,
        );
      }
    }

    return updated;
  }

  async createOrder(buyerId: string, itemId: string, dto: CreateOrderDto) {
    const buyerAccount = await this.prisma.user.findUnique({
      where: { id: buyerId },
      select: {
        id: true,
        name: true,
        accountStatus: true,
        suspendedUntil: true,
        moderationReason: true,
      },
    });
    if (!buyerAccount) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    await this.ensureMarketplaceAccess(buyerAccount);

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
    if (item.status === 'CONCLUIDO' || item.status === 'SUSPENSO') {
      throw new ConflictException('Este anúncio não está mais disponível.');
    }
    if (!item.user.phone) {
      throw new BadRequestException(
        'O vendedor ainda não configurou um WhatsApp de contato.',
      );
    }

    const meetupDay = normalizeMeetupDay(dto.meetupDay);

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
      meetupDay,
      meetupTime: dto.meetupTime.trim(),
      campusBlock,
      status: 'PENDENTE' as const,
    };

    const existing = await this.prisma.itemInterest.findUnique({
      where: { itemId_buyerId: { itemId, buyerId } },
    });

    const buyer = buyerAccount;

    const assertResubmittable = (status: OrderStatus) => {
      if (status === 'ENTREGUE') {
        throw new ConflictException(
          'Este pedido já foi concluído. Não é possível reenviar.',
        );
      }
      if (status === 'NEGOCIANDO') {
        throw new ConflictException(
          'Este pedido já está em negociação com o vendedor. Aguarde a confirmação.',
        );
      }
    };

    let order;
    let isNewOrder = false;
    if (existing) {
      assertResubmittable(existing.status);
      // Preserva o status atual (PENDENTE) — só a criação inicial define PENDENTE.
      const { status: _ignored, ...updateData } = orderData;
      order = await this.prisma.itemInterest.update({
        where: { id: existing.id },
        data: updateData,
      });
    } else {
      try {
        order = await this.prisma.itemInterest.create({
          data: { itemId, buyerId, ...orderData },
        });
        isNewOrder = true;
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          // Corrida: outro request criou o pedido entre o findUnique e o create.
          const raced = await this.prisma.itemInterest.findUniqueOrThrow({
            where: { itemId_buyerId: { itemId, buyerId } },
          });
          assertResubmittable(raced.status);
          const { status: _ignored, ...updateData } = orderData;
          order = await this.prisma.itemInterest.update({
            where: { id: raced.id },
            data: updateData,
          });
        } else {
          throw error;
        }
      }
    }

    if (isNewOrder) {
      const offerHint =
        !item.isDonation && !acceptListedPrice && offeredPrice != null
          ? ` Propôs ${Number(offeredPrice).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}.`
          : '';
      await this.notifications.create(
        item.userId,
        'NEW_INTEREST',
        'Nova proposta no seu anúncio',
        `${buyer?.name ?? 'Alguém'} preencheu o formulário de interesse em "${item.title}".${offerHint} Veja em Meus anúncios → Pedidos.`,
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
        buyer: {
          select: { id: true, name: true, phone: true, avatarUrl: true },
        },
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
    const seller = await this.prisma.user.findUnique({ where: { id: sellerId } });
    if (!seller) throw new NotFoundException('Usuário não encontrado.');
    await this.ensureMarketplaceAccess(seller);

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
    if (order.item.status === 'SUSPENSO') {
      throw new ForbiddenException(
        'Este anúncio está suspenso pela moderação.',
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
      const updatedOrder = await this.prisma.$transaction(async (tx) => {
        // Só permite virar NEGOCIANDO se ninguém mais já estiver negociando
        // este anúncio — evita que dois pedidos concorrentes "ganhem" a mesma vaga.
        const itemUpdate = await tx.item.updateMany({
          where: {
            id: order.itemId,
            status: { in: ['ATIVO', 'NEGOCIANDO'] },
            OR: [{ negotiatingWithId: null }, { negotiatingWithId: order.buyerId }],
          },
          data: {
            status: 'NEGOCIANDO',
            negotiatingWithId: order.buyerId,
          },
        });
        if (itemUpdate.count === 0) {
          throw new ConflictException(
            'Este anúncio já está em negociação com outro comprador.',
          );
        }
        return tx.itemInterest.update({
          where: { id: orderId },
          data: { status: 'NEGOCIANDO' },
        });
      });

      if (current !== 'NEGOCIANDO') {
        await this.notifications.create(
          order.buyerId,
          'PROPOSAL_ACCEPTED',
          'Sua proposta foi aceita!',
          `O vendedor aceitou negociar "${order.item.title}" com você. Combine a entrega pelo WhatsApp.`,
          order.itemId,
        );

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
            'O vendedor começou a negociar com outra pessoa neste anúncio.',
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
      const updatedOrder = await this.prisma.$transaction(async (tx) => {
        const itemUpdate = await tx.item.updateMany({
          where: {
            id: order.itemId,
            negotiatingWithId: order.buyerId,
          },
          data: {
            status: 'CONCLUIDO',
            negotiatingWithId: order.buyerId,
          },
        });
        if (itemUpdate.count === 0) {
          throw new ConflictException(
            'A negociação deste pedido não está mais ativa.',
          );
        }
        return tx.itemInterest.update({
          where: { id: orderId },
          data: { status: 'ENTREGUE' },
        });
      });

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
          `"${order.item.title}" não está mais disponível`,
          order.item.isDonation
            ? 'Este item foi doado para outra pessoa.'
            : 'Este item foi vendido para outra pessoa.',
          order.itemId,
        );
      }

      await this.notifySavedWatchers(
        order.itemId,
        order.item.title,
        order.item.isDonation,
        order.buyerId,
      );

      await this.notifications.create(
        order.buyerId,
        'ORDER_DELIVERED',
        order.item.isDonation ? 'Doação concluída!' : 'Compra concluída!',
        `"${order.item.title}" foi marcado como entregue. Obrigado por usar o Desapega.`,
        order.itemId,
      );

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

  private async notifySavedWatchers(
    itemId: string,
    title: string,
    isDonation: boolean,
    excludeUserId?: string | null,
  ) {
    const saved = await this.prisma.savedItem.findMany({
      where: {
        itemId,
        ...(excludeUserId ? { userId: { not: excludeUserId } } : {}),
      },
      select: { userId: true },
    });
    if (saved.length === 0) return;
    await this.notifications.notifyMany(
      saved.map((s) => s.userId),
      'ITEM_SAVED_UPDATE',
      `"${title}" saiu da sua lista`,
      isDonation
        ? 'Um anúncio que você salvou foi doado e não está mais disponível.'
        : 'Um anúncio que você salvou foi vendido e não está mais disponível.',
      itemId,
    );
  }

  async listComments(itemId: string) {
    const item = await this.prisma.item.findUnique({ where: { id: itemId } });
    if (!item) {
      throw new NotFoundException('Anúncio não encontrado.');
    }
    return this.prisma.itemComment.findMany({
      where: { itemId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });
  }

  async createComment(userId: string, itemId: string, dto: CreateCommentDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }
    await this.ensureMarketplaceAccess(user);

    const item = await this.prisma.item.findUnique({ where: { id: itemId } });
    if (!item) {
      throw new NotFoundException('Anúncio não encontrado.');
    }

    const comment = await this.prisma.itemComment.create({
      data: {
        itemId,
        userId,
        body: dto.body.trim(),
      },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });

    if (item.userId !== userId) {
      const asker = comment.user.name;
      await this.notifications.create(
        item.userId,
        'NEW_INTEREST',
        'Nova dúvida no seu anúncio',
        `${asker} comentou em "${item.title}": ${comment.body.slice(0, 80)}${comment.body.length > 80 ? '…' : ''}`,
        itemId,
      );
    }

    return comment;
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

  private async ensureMarketplaceAccess(user: {
    id?: string;
    accountStatus: string;
    suspendedUntil: Date | null;
    moderationReason: string | null;
  }) {
    if (isSuspensionExpired(user as never)) {
      if (user.id) {
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
      }
      return;
    }
    assertMarketplaceAllowed(user as never);
  }
}
