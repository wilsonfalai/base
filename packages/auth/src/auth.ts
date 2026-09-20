import { prismaAdapter } from '@better-auth/prisma-adapter';
import type { DatabaseClient } from '@base-app/database';
import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { admin } from 'better-auth/plugins';
import { accessControl, authRoles } from './permissions.js';

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
    appName: 'Base App',
    baseURL,
    database: prismaAdapter(database, {
      provider: 'postgresql',
    }),
    databaseHooks: {
      user: {
        create: {
          after: async (user, context) => {
            const actorUserId = context?.context.session?.user.id;

            if (actorUserId) {
              await database.auditLog.create({
                data: {
                  action: 'user.created',
                  actorUserId,
                  entityId: user.id,
                  entityType: 'user',
                },
              });
            }
          },
        },
        update: {
          after: async (user, context) => {
            const actorUserId = context?.context.session?.user.id;

            if (actorUserId) {
              await database.auditLog.create({
                data: {
                  action: 'user.updated',
                  actorUserId,
                  entityId: user.id,
                  entityType: 'user',
                },
              });
            }
          },
        },
      },
    },
    emailAndPassword: {
      disableSignUp,
      enabled: true,
    },
    plugins: [
      admin({
        ac: accessControl,
        adminRoles: ['admin'],
        bannedUserMessage: 'Este usuário está inativo.',
        defaultRole: 'collaborator',
        roles: authRoles,
      }),
    ],
    secret,
    trustedOrigins: [...new Set([baseURL, ...trustedOrigins])],
  };
}

export type Auth = ReturnType<typeof betterAuth>;

export function createAuth(options: CreateAuthOptions): Auth {
  return betterAuth(createAuthOptions(options));
}
