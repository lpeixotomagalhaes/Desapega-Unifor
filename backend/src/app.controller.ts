import { Controller, Get, Logger } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async health() {
    const db = await this.prisma.ping();
    if (!db.ok) {
      this.logger.error(`Health check: Postgres down — ${db.error}`);
    }
    return {
      status: db.ok ? 'ok' : 'degraded',
      service: 'desapega-unifor-api',
      db: db.ok ? 'up' : 'down',
    };
  }
}
