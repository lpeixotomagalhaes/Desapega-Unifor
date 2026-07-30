import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
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
}
