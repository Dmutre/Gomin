import { Injectable } from '@nestjs/common';
import { UserSessionRepository } from './user-session.repository';
import type {
  CreateSessionParams,
  SessionDeviceInfoUpdate,
  UserSessionDomainModel,
} from './types/user-session.domain.model';
import { RevokeReason } from './types/user-session.domain.model';
import { randomBytes, randomUUID } from 'crypto';

@Injectable()
export class UserSessionService {
  private readonly sessionExpirationMs = 30 * 24 * 60 * 60 * 1000; // 30 days

  constructor(private readonly userSessionRepository: UserSessionRepository) {}

  async getOrCreateSessionForDevice(
    params: CreateSessionParams,
  ): Promise<UserSessionDomainModel> {
    const deviceId = params.deviceId?.trim() || null;
    if (deviceId) {
      const existingSession =
        await this.userSessionRepository.getActiveSessionByUserIdAndDeviceId(
          params.userId,
          deviceId,
        );
      if (existingSession) {
        const deviceInfo: SessionDeviceInfoUpdate = {
          deviceName: params.deviceName,
          deviceType: params.deviceType,
          os: params.os,
          browser: params.browser,
          appVersion: params.appVersion,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        };
        const newExpiresAt = new Date(Date.now() + this.sessionExpirationMs);
        const updated =
          await this.userSessionRepository.updateSessionDeviceInfoAndExtendValidity(
            existingSession.sessionToken,
            deviceInfo,
            newExpiresAt,
          );
        if (updated) return updated;
      }
    }
    return this.createNewSession(params);
  }

  async createNewSession(
    params: CreateSessionParams,
  ): Promise<UserSessionDomainModel> {
    const sessionModel: UserSessionDomainModel = {
      ...params,
      id: randomUUID(),
      sessionToken: randomBytes(32).toString('hex'),
      isActive: true,
      createdAt: new Date(),
      lastActivityAt: new Date(),
      expiresAt: new Date(Date.now() + this.sessionExpirationMs),
      revokedAt: null,
      revokeReason: null,
    };
    return this.userSessionRepository.insertSession(sessionModel);
  }

  async getActiveSessionByToken(
    sessionToken: string,
  ): Promise<UserSessionDomainModel | null> {
    return this.userSessionRepository.getActiveSessionByToken(sessionToken);
  }

  async getActiveSessionsByUserId(
    userId: string,
  ): Promise<UserSessionDomainModel[]> {
    return this.userSessionRepository.getActiveSessionsByUserId(userId);
  }

  async revokeSessionByToken(
    sessionToken: string,
    reason: RevokeReason = RevokeReason.USER_TERMINATED,
  ): Promise<void> {
    return this.userSessionRepository.revokeSessionByToken(sessionToken, reason);
  }

  async revokeOtherSessionsByToken(
    userId: string,
    excludeSessionToken: string,
    reason: RevokeReason = RevokeReason.USER_TERMINATED_ALL,
  ): Promise<number> {
    return this.userSessionRepository.revokeOtherSessionsByToken(
      userId,
      excludeSessionToken,
      reason,
    );
  }
}
