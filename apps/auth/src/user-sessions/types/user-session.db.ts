import type { DomainDeviceType, RevokeReason } from './user-session.domain.model';

export type UserSessionDb = {
  id: string;
  userId: string;
  sessionTokenHash: string;
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
};
