import type { UserRole } from '@base-app/auth/permissions';
import { SetMetadata } from '@nestjs/common';

export const REQUIRED_ROLES = 'auth:required-roles';

export const Roles = (...roles: UserRole[]) =>
  SetMetadata(REQUIRED_ROLES, roles);
