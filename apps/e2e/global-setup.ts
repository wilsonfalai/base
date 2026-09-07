import { createAuth } from "@mosaicgestao/auth";
import { createPrismaClient } from "@mosaicgestao/database";
import { config } from "dotenv";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../..", import.meta.url));

config({ path: `${repositoryRoot}/.env`, quiet: true });

export const e2eUsers = {
  admin: {
    email: "e2e.admin@mosaic.local",
    name: "Administrador E2E",
    password: "E2e-admin-only-password-123!",
    role: "admin" as const,
  },
  collaborator: {
    email: process.env.E2E_USER_EMAIL ?? "e2e.collaborator@mosaic.local",
    name: process.env.E2E_USER_NAME ?? "Colaborador E2E",
    password: process.env.E2E_USER_PASSWORD ?? "E2e-only-password-123!",
    role: "collaborator" as const,
  },
  managed: {
    email: "e2e.managed@mosaic.local",
    name: "Usuário Gerenciado E2E",
    password: "E2e-managed-only-password-123!",
    role: "collaborator" as const,
  },
};

export default async function globalSetup() {
  const databaseUrl = process.env.DATABASE_URL;
  const baseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  const secret = process.env.BETTER_AUTH_SECRET;

  if (!databaseUrl || !secret) {
    throw new Error(
      "DATABASE_URL and BETTER_AUTH_SECRET are required for authenticated E2E tests",
    );
  }

  const database = createPrismaClient(databaseUrl);
  const auth = createAuth({
    baseURL,
    database,
    disableSignUp: false,
    secret,
    trustedOrigins: [process.env.E2E_BASE_URL ?? baseURL],
  });

  const fixtureEmails = Object.values(e2eUsers).map((user) => user.email);

  async function cleanFixtureUsers() {
    const users = await database.user.findMany({
      select: { id: true },
      where: { email: { in: fixtureEmails } },
    });
    const userIds = users.map((user) => user.id);

    if (userIds.length > 0) {
      await database.auditLog.deleteMany({
        where: {
          OR: [
            { actorUserId: { in: userIds } },
            { entityId: { in: userIds }, entityType: "user" },
          ],
        },
      });
    }

    await database.user.deleteMany({ where: { email: { in: fixtureEmails } } });
  }

  await cleanFixtureUsers();
  await auth.api.signUpEmail({
    body: {
      email: e2eUsers.collaborator.email,
      name: e2eUsers.collaborator.name,
      password: e2eUsers.collaborator.password,
    },
  });
  await auth.api.signUpEmail({
    body: {
      email: e2eUsers.admin.email,
      name: e2eUsers.admin.name,
      password: e2eUsers.admin.password,
    },
  });
  await database.user.update({
    data: { role: e2eUsers.admin.role },
    where: { email: e2eUsers.admin.email },
  });

  return async () => {
    await cleanFixtureUsers();
    await database.$disconnect();
  };
}
