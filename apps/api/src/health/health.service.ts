import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class HealthService {
  constructor(private readonly prismaService: PrismaService) {}

  async checkReadiness() {
    try {
      await this.prismaService.client.$queryRaw`SELECT 1`;

      return {
        status: 'ok' as const,
        checks: { database: 'up' as const },
      };
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        checks: { database: 'down' },
      });
    }
  }
}
