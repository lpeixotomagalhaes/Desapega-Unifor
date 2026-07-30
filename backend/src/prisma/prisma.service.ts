import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

function buildAdapter() {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL não definida. No Render, use a connection string do pooler Supabase (porta 6543) com ?pgbouncer=true.',
    );
  }

  // Render (IPv4) não alcança o host direto db.*.supabase.co (muitas vezes só IPv6).
  // Em produção a URL precisa ser o pooler (...pooler.supabase.com:6543).
  if (
    process.env.NODE_ENV === 'production' &&
    /db\.[a-z0-9]+\.supabase\.co/i.test(connectionString) &&
    !/pooler\.supabase\.com/i.test(connectionString)
  ) {
    throw new Error(
      'DATABASE_URL aponta para o host direto do Supabase (db.*.supabase.co). Use o Transaction pooler (porta 6543 / pooler.supabase.com) no Render.',
    );
  }

  return new PrismaPg({ connectionString });
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      adapter: buildAdapter(),
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      await this.$queryRaw`SELECT 1`;
      this.logger.log('Conexão com o Postgres OK');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Falha ao conectar no Postgres: ${message}`);
      // Em produção deixamos a API subir para o health check reportar o erro;
      // rotas que usam o banco continuarão retornando 500 até a URL/senha/IP liberarem.
      if (process.env.NODE_ENV !== 'production') {
        throw error;
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async ping(): Promise<{ ok: true } | { ok: false; error: string }> {
    try {
      await this.$queryRaw`SELECT 1`;
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
