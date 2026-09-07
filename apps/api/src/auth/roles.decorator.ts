import type { UserRole } from '@mosaicgestao/auth/permissions';
import { SetMetadata } from '@nestjs/common';

export const REQUIRED_ROLES = 'auth:required-roles';

export const Roles = (...roles: UserRole[]) =>
  SetMetadata(REQUIRED_ROLES, roles);
