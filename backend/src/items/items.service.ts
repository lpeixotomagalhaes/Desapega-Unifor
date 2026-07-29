import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Prisma } from '../generated/prisma/client';
import { CreateItemDto } from './dto/create-item.dto';
import { QueryItemsDto } from './dto/query-items.dto';

const itemWithOwner = {
  include: {
    user: { select: { id: true, name: true } },
  },
} satisfies Prisma.ItemDefaultArgs;

@Injectable()
export class ItemsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(query: QueryItemsDto) {
    const where: Prisma.ItemWhereInput = { status: 'ATIVO' };

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

  create(userId: string, dto: CreateItemDto) {
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
