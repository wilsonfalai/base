import { createAuth } from '@base-app/auth';
import {
  createPrismaClient,
  type DatabaseClient,
} from '@base-app/database';

describe('user administration persistence', () => {
  let auth: ReturnType<typeof createAuth>;
  let baseURL: string;
  let database: DatabaseClient;
  let sessionCookie: string;

  const administrator = {
    email: 'integration.admin@base-app.local',
    name: 'Integration Administrator',
    password: 'Integration-admin-password-123!',
  };
  const managedUser = {
    email: 'integration.managed@base-app.local',
    name: 'Integration Managed User',
    password: 'Integration-managed-password-123!',
    role: 'collaborator',
  };

  async function cleanFixtures() {
    const users = await database.user.findMany({
      select: { id: true },
      where: { email: { in: [administrator.email, managedUser.email] } },
    });
    const userIds = users.map((user) => user.id);

    if (userIds.length > 0) {
      await database.auditLog.deleteMany({
        where: {
          OR: [
            { actorUserId: { in: userIds } },
            { entityId: { in: userIds }, entityType: 'user' },
          ],
        },
      });
    }

    await database.user.deleteMany({
      where: { email: { in: [administrator.email, managedUser.email] } },
    });
  }

  async function postAsAdministrator(path: string, body: object) {
    return auth.handler(
      new Request(`${baseURL}/api/auth${path}`, {
        body: JSON.stringify(body),
        headers: {
          'content-type': 'application/json',
          cookie: sessionCookie,
          origin: baseURL,
        },
        method: 'POST',
      }),
    );
  }

  beforeAll(async () => {
    const databaseUrl = process.env.DATABASE_URL;
    const secret = process.env.BETTER_AUTH_SECRET;
    baseURL = process.env.BETTER_AUTH_URL ?? 'http://localhost:3000';

    if (!databaseUrl || !secret) {
      throw new Error('Authentication test environment is incomplete');
    }

    database = createPrismaClient(databaseUrl);
    auth = createAuth({
      baseURL,
      database,
      disableSignUp: false,
      secret,
      trustedOrigins: [baseURL],
    });

    await cleanFixtures();
    await auth.api.signUpEmail({ body: administrator });
    await database.user.update({
      data: { role: 'admin' },
      where: { email: administrator.email },
    });

    const signIn = await auth.api.signInEmail({
      body: {
        email: administrator.email,
        password: administrator.password,
      },
      returnHeaders: true,
    });
    const setCookie = signIn.headers.get('set-cookie');

    if (!setCookie) {
      throw new Error('Better Auth did not return the administrator cookie');
    }

    sessionCookie = setCookie;
  });

  afterAll(async () => {
    await cleanFixtures();
    await database.$disconnect();
  });

  it('creates a user and records the authenticated administrator', async () => {
    const response = await postAsAdministrator(
      '/admin/create-user',
      managedUser,
    );
    expect(response.status).toBe(200);

    const actor = await database.user.findUniqueOrThrow({
      select: { id: true },
      where: { email: administrator.email },
    });
    const target = await database.user.findUniqueOrThrow({
      select: { id: true },
      where: { email: managedUser.email },
    });

    await expect(
      database.auditLog.findFirst({
        where: {
          action: 'user.created',
          actorUserId: actor.id,
          entityId: target.id,
          entityType: 'user',
        },
      }),
    ).resolves.not.toBeNull();
  });
});
