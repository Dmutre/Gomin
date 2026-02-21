export enum DomainDeviceType {
  MOBILE = 'MOBILE',
  DESKTOP = 'DESKTOP',
  TABLET = 'TABLET',
  WEB = 'WEB',
}

export enum RevokeReason {
  USER_LOGOUT = 'USER_LOGOUT',
  USER_TERMINATED = 'USER_TERMINATED',
  USER_TERMINATED_ALL = 'USER_TERMINATED_ALL',
  EXPIRED = 'EXPIRED',
  INACTIVITY = 'INACTIVITY',
  SECURITY_BREACH = 'SECURITY_BREACH',
  ADMIN_ACTION = 'ADMIN_ACTION',
  TOKEN_REUSE_DETECTED = 'TOKEN_REUSE_DETECTED',
  SESSION_LIMIT_REACHED = 'SESSION_LIMIT_REACHED',
}

export interface UserSessionDomainModel {
  id: string;
  userId: string;
  sessionToken: string;
  deviceId: string | null;
  deviceName: string | null;
  deviceType: DomainDeviceType | null;
  os: string | null;
  browser: string | null;
  appVersion: string | null;
  ipAddress: string;
  country: string | null;
  city: string | null;
  userAgent: string | null;
  createdAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
  isActive: boolean;
  revokedAt: Date | null;
  revokeReason: RevokeReason | null;
}

export type CreateSessionParams = Omit<
  UserSessionDomainModel,
  | 'id'
  | 'sessionToken'
  | 'createdAt'
  | 'lastActivityAt'
  | 'expiresAt'
  | 'revokeReason'
  | 'revokedAt'
  | 'isActive'
>;

export type SessionDeviceInfoUpdate = Pick<
  UserSessionDomainModel,
  | 'deviceName'
  | 'deviceType'
  | 'os'
  | 'browser'
  | 'appVersion'
  | 'ipAddress'
  | 'userAgent'
>;
