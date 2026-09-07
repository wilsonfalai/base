import { createAccessControl } from 'better-auth/plugins/access';
import {
  adminAc,
  defaultStatements,
} from 'better-auth/plugins/admin/access';
import type { UserWithRole } from 'better-auth/plugins/admin';

export const USER_ROLES = ['admin', 'collaborator'] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type InternalUser = Omit<UserWithRole, 'role'> & {
  role?: UserRole | undefined;
};

export const accessControl = createAccessControl({
  ...defaultStatements,
} as const);

export const administrator = accessControl.newRole({
  ...adminAc.statements,
});

export const collaborator = accessControl.newRole({});

export const authRoles = {
  admin: administrator,
  collaborator,
};

export function isUserRole(role: string | null | undefined): role is UserRole {
  return USER_ROLES.includes(role as UserRole);
}
