import { Controller, Get, Req } from '@nestjs/common';
import type { AuthenticatedRequest } from './auth.guard.js';

@Controller('auth')
export class AuthController {
  @Get('session')
  getSession(@Req() request: AuthenticatedRequest) {
    const { session, user } = request.authSession;

    return {
      session: {
        expiresAt: session.expiresAt,
        id: session.id,
      },
      user,
    };
  }
}
