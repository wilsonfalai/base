import { ServiceUnavailableException } from '@nestjs/common';
import { HealthService } from './health.service.js';
import type { PrismaService } from '../database/prisma.service.js';

describe('HealthService', () => {
  it('reports readiness when the database responds', async () => {
    const prismaService = {
      client: { $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]) },
    } as unknown as PrismaService;
    const service = new HealthService(prismaService);

    await expect(service.checkReadiness()).resolves.toEqual({
      status: 'ok',
      checks: { database: 'up' },
    });
  });

  it('returns service unavailable without leaking the database error', async () => {
    const prismaService = {
      client: { $queryRaw: vi.fn().mockRejectedValue(new Error('secret detail')) },
    } as unknown as PrismaService;
    const service = new HealthService(prismaService);

    await expect(service.checkReadiness()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
