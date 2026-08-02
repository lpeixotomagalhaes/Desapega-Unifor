import { Controller, Get, Logger } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async health() {
    const db = await this.prisma.ping();
    return {
      status: db.ok ? 'ok' : 'degraded',
      service: 'desapega-unifor-api',
      db: db.ok ? 'up' : 'down',
      ...(db.ok ? {} : { dbError: db.error }),
    };
  }

  /** Diagnóstico temporário (remover depois). */
  @Get('debug/items')
  async debugItems() {
    try {
      const items = await this.prisma.item.findMany({
        take: 1,
        include: { user: { select: { id: true, name: true } } },
      });
      const plain = JSON.parse(JSON.stringify(items));
      return {
        ok: true,
        count: items.length,
        priceType: items[0] ? typeof items[0].price : null,
        priceCtor: items[0]?.price?.constructor?.name ?? null,
        sample: plain[0] ?? null,
      };
    } catch (error) {
      const err = error as Error & { code?: string; meta?: unknown };
      this.logger.error(`debug/items failed: ${err.message}`, err.stack);
      return {
        ok: false,
        message: err.message,
        code: err.code ?? null,
        meta: err.meta ?? null,
      };
    }
  }

  @Get('debug/user-schema')
  async debugUserSchema() {
    try {
      const cols = await this.prisma.$queryRaw<
        Array<{ column_name: string; udt_name: string }>
      >`
        SELECT column_name, udt_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'User'
        ORDER BY ordinal_position
      `;
      const sample = await this.prisma.user.findFirst({
        select: {
          id: true,
          email: true,
          role: true,
          bio: true,
          googleId: true,
        },
      });
      return { ok: true, columns: cols, sample };
    } catch (error) {
      const err = error as Error & { code?: string; meta?: unknown };
      this.logger.error(`debug/user-schema failed: ${err.message}`, err.stack);
      return {
        ok: false,
        message: err.message,
        code: err.code ?? null,
        meta: err.meta ?? null,
      };
    }
  }
}
