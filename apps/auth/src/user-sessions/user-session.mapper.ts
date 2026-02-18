import type { UserSessionDb } from './types/user-session.db';
import type { UserSessionDomainModel } from './types/user-session.domain.model';

export class UserSessionMapper {
  static toDomainModel(session: UserSessionDb): UserSessionDomainModel {
    return {
      id: session.id,
      userId: session.userId,
      sessionTokenHash: session.sessionTokenHash,
      deviceId: session.deviceId,
      deviceName: session.deviceName,
      deviceType: session.deviceType,
      os: session.os,
      browser: session.browser,
      appVersion: session.appVersion,
      ipAddress: session.ipAddress,
      country: session.country,
      city: session.city,
      userAgent: session.userAgent,
      createdAt: session.createdAt,
      lastActivityAt: session.lastActivityAt,
      expiresAt: session.expiresAt,
      isActive: session.isActive,
      revokedAt: session.revokedAt,
      revokeReason: session.revokeReason,
    };
  }

  static toEntity(session: UserSessionDomainModel): UserSessionDb {
    return {
      id: session.id,
      userId: session.userId,
      sessionTokenHash: session.sessionTokenHash,
      deviceId: session.deviceId,
      deviceName: session.deviceName,
      deviceType: session.deviceType,
      os: session.os,
      browser: session.browser,
      appVersion: session.appVersion,
      ipAddress: session.ipAddress,
      country: session.country,
      city: session.city,
      userAgent: session.userAgent,
      createdAt: session.createdAt,
      lastActivityAt: session.lastActivityAt,
      expiresAt: session.expiresAt,
      isActive: session.isActive,
      revokedAt: session.revokedAt,
      revokeReason: session.revokeReason,
    };
  }
}
