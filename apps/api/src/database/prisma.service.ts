import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import {
  createPrismaClient,
  type DatabaseClient,
} from '@mosaicgestao/database';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private databaseClient?: DatabaseClient;

  get client(): DatabaseClient {
    if (!this.databaseClient) {
      throw new Error('Database client is not connected');
    }

    return this.databaseClient;
  }

  async onModuleInit(): Promise<void> {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is required');
    }

    this.databaseClient = createPrismaClient(databaseUrl);
    await this.databaseClient.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.databaseClient?.$disconnect();
    this.databaseClient = undefined;
  }
}
