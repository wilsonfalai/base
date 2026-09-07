import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createAuth, type Auth } from '@mosaicgestao/auth';
import { fromNodeHeaders } from 'better-auth/node';
import type { IncomingHttpHeaders } from 'node:http';
import type { Environment } from '../config/environment.js';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class AuthService {
  private authInstance?: Auth;

  constructor(
    private readonly configService: ConfigService<Environment, true>,
    private readonly prismaService: PrismaService,
  ) {}

  get auth(): Auth {
    if (!this.authInstance) {
      const baseURL = this.configService.get('BETTER_AUTH_URL', { infer: true });

      this.authInstance = createAuth({
        baseURL,
        database: this.prismaService.client,
        secret: this.configService.get('BETTER_AUTH_SECRET', { infer: true }),
        trustedOrigins: [
          this.configService.get('WEB_ORIGIN', { infer: true }),
        ],
      });
    }

    return this.authInstance;
  }

  getSession(headers: IncomingHttpHeaders) {
    return this.auth.api.getSession({ headers: fromNodeHeaders(headers) });
  }
}

export type AuthSession = NonNullable<
  Awaited<ReturnType<AuthService['getSession']>>
>;
