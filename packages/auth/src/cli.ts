import { config } from 'dotenv';

import { createPrismaClient } from '@base-app/database';

import { createAuth, type Auth } from './auth.js';

config({ path: '../../.env', quiet: true });
config({ path: '.env', override: true, quiet: true });

function requiredEnvironment(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

const baseURL = requiredEnvironment('BETTER_AUTH_URL');
const database = createPrismaClient(requiredEnvironment('DATABASE_URL'));

export const auth: Auth = createAuth({
  baseURL,
  database,
  secret: requiredEnvironment('BETTER_AUTH_SECRET'),
  trustedOrigins: [process.env.WEB_ORIGIN ?? baseURL],
});
