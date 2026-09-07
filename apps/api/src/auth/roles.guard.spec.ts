import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { vi } from 'vitest';
import type { AuthenticatedRequest } from './auth.guard.js';
import { RolesGuard } from './roles.guard.js';

function createContext(role?: string): ExecutionContext {
  const request = {
    authSession: { user: { role } },
  } as AuthenticatedRequest;

  return {
    getClass: vi.fn(),
    getHandler: vi.fn(),
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const reflector = {
    getAllAndOverride: vi.fn(),
  } as unknown as Reflector;
  const guard = new RolesGuard(reflector);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows routes without a role policy', () => {
    vi.mocked(reflector.getAllAndOverride).mockReturnValue(undefined);

    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('allows a user with the required role', () => {
    vi.mocked(reflector.getAllAndOverride).mockReturnValue(['admin']);

    expect(guard.canActivate(createContext('admin'))).toBe(true);
  });

  it('denies a collaborator on an administrator route', () => {
    vi.mocked(reflector.getAllAndOverride).mockReturnValue(['admin']);

    expect(() => guard.canActivate(createContext('collaborator'))).toThrow(
      ForbiddenException,
    );
  });
});
