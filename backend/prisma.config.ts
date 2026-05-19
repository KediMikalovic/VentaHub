import { defineConfig, env } from 'prisma/config';
import 'dotenv/config'; // Load .env file automatically

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
  migrations: {
    seed: 'npx ts-node prisma/seed.ts',
  },
});
