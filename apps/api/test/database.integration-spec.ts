import {
  createPrismaClient,
  type DatabaseClient,
} from '@mosaicgestao/database';

describe('PostgreSQL integration', () => {
  let client: DatabaseClient;

  beforeAll(async () => {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is required for integration tests');
    }

    client = createPrismaClient(databaseUrl);
    await client.$connect();
  });

  afterAll(async () => {
    await client?.$disconnect();
  });

  it('connects to the expected PostgreSQL database', async () => {
    const [result] = await client.$queryRaw<
      Array<{ database: string; version: string }>
    >`SELECT current_database() AS database, current_setting('server_version') AS version`;

    expect(result.database).toBe('mosaicgestao');
    expect(result.version).toMatch(/^18\./);
  });

  it('has all project migrations applied', async () => {
    const migrations = await client.$queryRaw<
      Array<{ migration_name: string }>
    >`
      SELECT migration_name
      FROM "_prisma_migrations"
      WHERE finished_at IS NOT NULL
      ORDER BY finished_at
    `;

    expect(migrations.map(({ migration_name }) => migration_name)).toEqual([
      '20260907020000_initial_baseline',
      '20260907123242_add_better_auth',
      '20260907174208_add_audit_log',
    ]);
  });
});
