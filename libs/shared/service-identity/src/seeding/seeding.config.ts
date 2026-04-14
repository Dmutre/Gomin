import { Permission } from '../permissions/permissions.types';
import { ServiceIdentity } from '../service-identities/service.registry';

export interface ServiceSeedConfig {
  serviceName: ServiceIdentity;
  permissions: Permission[];
}

export const SERVICES_SEED_CONFIG: ServiceSeedConfig[] = [
  {
    serviceName: ServiceIdentity.AUTH_SERVICE,
    permissions: [
      Permission.AUTH_SERVICE_USERS_READ,
      Permission.AUTH_SERVICE_USERS_WRITE,
      Permission.AUTH_SERVICE_SESSIONS_READ,
      Permission.AUTH_SERVICE_SESSIONS_WRITE,
      Permission.AUTH_SERVICE_SESSIONS_INVALIDATE,
    ],
  },
  {
    serviceName: ServiceIdentity.GATEWAY_SERVICE,
    permissions: [
      Permission.AUTH_SERVICE_USERS_READ,
      Permission.AUTH_SERVICE_USERS_WRITE,
      Permission.AUTH_SERVICE_SESSIONS_READ,
      Permission.AUTH_SERVICE_SESSIONS_WRITE,
      Permission.AUTH_SERVICE_SESSIONS_INVALIDATE,
      Permission.COMMUNICATION_CHATS_READ,
      Permission.COMMUNICATION_CHATS_WRITE,
      Permission.COMMUNICATION_MESSAGES_READ,
      Permission.COMMUNICATION_MESSAGES_WRITE,
      Permission.COMMUNICATION_MESSAGES_DELETE,
      Permission.COMMUNICATION_MESSAGE_KEYS_READ,
      Permission.COMMUNICATION_MESSAGE_KEYS_WRITE,
    ],
  },
  {
    serviceName: ServiceIdentity.COMMUNICATION_SERVICE,
    permissions: [
      Permission.AUTH_SERVICE_USERS_READ,
      Permission.SERVICE_IDENTITY_GET_PUBLIC_KEYS,
    ],
  },
];
