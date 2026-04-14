export enum Permission {
  AUTH_SERVICE_USERS_READ = 'auth-service:users:read',
  AUTH_SERVICE_USERS_WRITE = 'auth-service:users:write',
  AUTH_SERVICE_SESSIONS_READ = 'auth-service:sessions:read',
  AUTH_SERVICE_SESSIONS_WRITE = 'auth-service:sessions:write',
  AUTH_SERVICE_SESSIONS_INVALIDATE = 'auth-service:sessions:invalidate',
  SERVICE_IDENTITY_GET_PUBLIC_KEYS = 'service-identity:public-keys:get',

  // Communication service permissions
  COMMUNICATION_CHATS_READ = 'communication-service:chats:read',
  COMMUNICATION_CHATS_WRITE = 'communication-service:chats:write',
  COMMUNICATION_MESSAGES_READ = 'communication-service:messages:read',
  COMMUNICATION_MESSAGES_WRITE = 'communication-service:messages:write',
  COMMUNICATION_MESSAGES_DELETE = 'communication-service:messages:delete',
  COMMUNICATION_MESSAGE_KEYS_READ = 'communication-service:message-keys:read',
  COMMUNICATION_MESSAGE_KEYS_WRITE = 'communication-service:message-keys:write',
}
