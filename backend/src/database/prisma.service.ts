import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const connectionString = `${process.env.DATABASE_URL}`;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }
  async onModuleInit() {
    await this.$connect();
    console.log('📦 Connected to PostgreSQL via Prisma');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('📦 Disconnected from PostgreSQL');
  }
}
