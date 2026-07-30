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
import { QueryItemsDto } from './dto/query-items.dto';
import { UpdateItemStatusDto } from './dto/update-item-status.dto';

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

  findAll(query: QueryItemsDto) {
    const where: Prisma.ItemWhereInput = {
      status: { in: ['ATIVO', 'NEGOCIANDO'] },
    };

    if (query.category) {
      where.category = query.category;
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.item.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      ...itemWithOwner,
    });
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
        category: dto.category,
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

  async expressInterest(buyerId: string, id: string) {
    const item = await this.prisma.item.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, phone: true } } },
    });
    if (!item) {
      throw new NotFoundException('Anúncio não encontrado.');
    }
    if (item.userId === buyerId) {
      throw new BadRequestException(
        'Você não pode se interessar pelo seu próprio anúncio.',
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

    const existing = await this.prisma.itemInterest.findUnique({
      where: { itemId_buyerId: { itemId: id, buyerId } },
    });

    if (!existing) {
      const buyer = await this.prisma.user.findUnique({
        where: { id: buyerId },
        select: { name: true },
      });
      await this.prisma.itemInterest.create({ data: { itemId: id, buyerId } });
      await this.notifications.create(
        item.userId,
        'NEW_INTEREST',
        'Novo interesse no seu anúncio',
        `${buyer?.name ?? 'Alguém'} demonstrou interesse em "${item.title}".`,
        id,
      );
    }

    const message = `Oi! Vi seu anúncio "${item.title}" no Desapega UNIFOR e tenho interesse.`;
    return { whatsappUrl: buildWhatsAppUrl(item.user.phone, message) };
  }

  findMyInterests(userId: string) {
    return this.prisma.itemInterest.findMany({
      where: { item: { userId } },
      orderBy: { createdAt: 'desc' },
      include: {
        item: {
          select: { id: true, title: true, imageUrl: true, status: true },
        },
        buyer: { select: { id: true, name: true } },
      },
    });
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
