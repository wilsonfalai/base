import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AuthService, type AuthSession } from './auth.service.js';
import { IS_PUBLIC_ROUTE } from './public.decorator.js';

export type AuthenticatedRequest = Request & { authSession: AuthSession };

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_ROUTE, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const session = await this.authService.getSession(request.headers);

    if (!session) {
      throw new UnauthorizedException('Authentication required');
    }

    request.authSession = session;
    return true;
  }
}
