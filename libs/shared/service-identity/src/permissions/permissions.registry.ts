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
    name: Permission.AUTH_SERVICE_SESSIONS_WRITE,
    description: 'Create sessions in auth service',
  },
  {
    name: Permission.AUTH_SERVICE_SESSIONS_INVALIDATE,
    description: 'Invalidate user sessions in auth service',
  },
  {
    name: Permission.SERVICE_IDENTITY_GET_PUBLIC_KEYS,
    description: 'Get public keys for service identity',
  },
  {
    name: Permission.COMMUNICATION_CHATS_READ,
    description: 'Read chat and member data from communication service',
  },
  {
    name: Permission.COMMUNICATION_CHATS_WRITE,
    description: 'Create or modify chats in communication service',
  },
  {
    name: Permission.COMMUNICATION_MESSAGES_READ,
    description: 'Read messages from communication service',
  },
  {
    name: Permission.COMMUNICATION_MESSAGES_WRITE,
    description: 'Send or edit messages in communication service',
  },
  {
    name: Permission.COMMUNICATION_MESSAGES_DELETE,
    description: 'Delete messages in communication service',
  },
  {
    name: Permission.COMMUNICATION_MESSAGE_KEYS_READ,
    description:
      'Retrieve per-recipient wrapped AES keys from communication service',
  },
  {
    name: Permission.COMMUNICATION_MESSAGE_KEYS_WRITE,
    description:
      'Store per-recipient wrapped AES keys in communication service',
  },
];
