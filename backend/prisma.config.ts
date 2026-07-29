import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // O CLI (migrations) usa a conexão direta; a API em runtime usa a
    // DATABASE_URL (pooler) via driver adapter em prisma.service.ts
    url: env('DIRECT_URL'),
  },
});
