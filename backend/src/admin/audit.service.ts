import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { sanitizeLimit, sanitizePage } from '../common/pagination.util';
import { PrismaService } from '../prisma/prisma.service';

export type AuditWriteInput = {
  actorId?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  summary: string;
  metadata?: Prisma.InputJsonValue;
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  create(input: AuditWriteInput) {
    return this.prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        action: input.action,
        targetType: input.targetType ?? null,
        targetId: input.targetId ?? null,
        summary: input.summary,
        metadata: input.metadata ?? undefined,
      },
    });
  }

  async list(params: {
    page?: number;
    limit?: number;
    action?: string;
  }) {
    const page = sanitizePage(params.page);
    const limit = sanitizeLimit(params.limit, 40);
    const where = params.action?.trim()
      ? { action: params.action.trim() }
      : undefined;

    const [total, entries] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          actor: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      }),
    ]);

    return { total, page, limit, entries };
  }
}
