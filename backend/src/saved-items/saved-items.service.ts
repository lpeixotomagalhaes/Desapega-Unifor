import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const itemWithOwner = {
  include: {
    user: { select: { id: true, name: true } },
  },
} as const;

@Injectable()
export class SavedItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async save(userId: string, itemId: string) {
    const item = await this.prisma.item.findUnique({ where: { id: itemId } });
    if (!item) {
      throw new NotFoundException('Anúncio não encontrado.');
    }
    if (item.userId === userId) {
      throw new BadRequestException(
        'Você não pode salvar o seu próprio anúncio.',
      );
    }
    if (item.status === 'CONCLUIDO') {
      throw new BadRequestException(
        'Este anúncio já foi concluído e não pode ser salvo.',
      );
    }

    await this.prisma.savedItem.upsert({
      where: { userId_itemId: { userId, itemId } },
      create: { userId, itemId },
      update: {},
    });

    return { saved: true, itemId };
  }

  async unsave(userId: string, itemId: string) {
    await this.prisma.savedItem.deleteMany({
      where: { userId, itemId },
    });
    return { saved: false, itemId };
  }

  listMine(userId: string) {
    return this.prisma.savedItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        item: itemWithOwner,
      },
    });
  }

  async listIds(userId: string) {
    const rows = await this.prisma.savedItem.findMany({
      where: { userId },
      select: { itemId: true },
    });
    return { ids: rows.map((r) => r.itemId) };
  }
}
