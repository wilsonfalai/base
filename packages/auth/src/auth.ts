import { prismaAdapter } from '@better-auth/prisma-adapter';
import type { DatabaseClient } from '@mosaicgestao/database';
import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { admin } from 'better-auth/plugins';

const MINIMUM_SECRET_LENGTH = 32;

export interface CreateAuthOptions {
  baseURL: string;
  database: DatabaseClient;
  disableSignUp?: boolean;
  secret: string;
  trustedOrigins?: string[];
}

function createAuthOptions({
  baseURL,
  database,
  disableSignUp = true,
  secret,
  trustedOrigins = [],
}: CreateAuthOptions): BetterAuthOptions {
  if (secret.length < MINIMUM_SECRET_LENGTH) {
    throw new Error(
      `BETTER_AUTH_SECRET must contain at least ${MINIMUM_SECRET_LENGTH} characters`,
    );
  }

  return {
    appName: 'Mosaic Gestão',
    baseURL,
    database: prismaAdapter(database, {
      provider: 'postgresql',
    }),
    emailAndPassword: {
      disableSignUp,
      enabled: true,
    },
    plugins: [admin()],
    secret,
    trustedOrigins: [...new Set([baseURL, ...trustedOrigins])],
  };
}

export type Auth = ReturnType<typeof betterAuth>;

export function createAuth(options: CreateAuthOptions): Auth {
  return betterAuth(createAuthOptions(options));
}
