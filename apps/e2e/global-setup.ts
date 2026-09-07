import { createAuth } from "@mosaicgestao/auth";
import { createPrismaClient } from "@mosaicgestao/database";
import { config } from "dotenv";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../..", import.meta.url));

config({ path: `${repositoryRoot}/.env`, quiet: true });

export const e2eUser = {
  email: process.env.E2E_USER_EMAIL ?? "e2e.admin@mosaic.local",
  name: process.env.E2E_USER_NAME ?? "Administrador E2E",
  password: process.env.E2E_USER_PASSWORD ?? "E2e-only-password-123!",
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

  await database.user.deleteMany({ where: { email: e2eUser.email } });
  await auth.api.signUpEmail({ body: e2eUser });

  return async () => {
    await database.user.deleteMany({ where: { email: e2eUser.email } });
    await database.$disconnect();
  };
}
