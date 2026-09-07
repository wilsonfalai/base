import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createPrismaClient,
  type DatabaseClient,
} from '@mosaicgestao/database';
import type { Environment } from '../config/environment.js';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private databaseClient?: DatabaseClient;

  constructor(
    private readonly configService: ConfigService<Environment, true>,
  ) {}

  get client(): DatabaseClient {
    if (!this.databaseClient) {
      throw new Error('Database client is not connected');
    }

    return this.databaseClient;
  }

  async onModuleInit(): Promise<void> {
    const databaseUrl = this.configService.get('DATABASE_URL', { infer: true });
    this.databaseClient = createPrismaClient(databaseUrl);
    await this.databaseClient.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.databaseClient?.$disconnect();
    this.databaseClient = undefined;
  }
}
