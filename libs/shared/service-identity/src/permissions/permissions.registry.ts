import { Permission } from './permissions.types';

export interface PermissionMeta {
  name: Permission;
  description: string;
}

export const PERMISSIONS_REGISTRY: PermissionMeta[] = [
  {
    name: Permission.AUTH_SERVICE_USERS_READ,
    description: 'Read user data from auth service',
  },
  {
    name: Permission.AUTH_SERVICE_USERS_WRITE,
    description: 'Create or update users in auth service',
  },
  {
    name: Permission.AUTH_SERVICE_SESSIONS_READ,
    description: 'Read session data from auth service',
  },
  {
    name: Permission.AUTH_SERVICE_SESSIONS_INVALIDATE,
    description: 'Invalidate user sessions in auth service',
  },
];
