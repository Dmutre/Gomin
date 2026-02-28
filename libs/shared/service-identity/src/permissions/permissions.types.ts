export enum Permission {
  AUTH_SERVICE_USERS_READ = 'auth-service:users:read',
  AUTH_SERVICE_USERS_WRITE = 'auth-service:users:write',
  AUTH_SERVICE_SESSIONS_READ = 'auth-service:sessions:read',
  AUTH_SERVICE_SESSIONS_WRITE = 'auth-service:sessions:write',
  AUTH_SERVICE_SESSIONS_INVALIDATE = 'auth-service:sessions:invalidate',
  SERVICE_IDENTITY_GET_PUBLIC_KEYS = 'service-identity:public-keys:get',
}
