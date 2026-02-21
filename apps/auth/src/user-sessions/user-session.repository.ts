import { Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { InjectConnection } from 'nest-knexjs';
import type {
  UserSessionDomainModel,
  SessionDeviceInfoUpdate,
} from './types/user-session.domain.model';
import { RevokeReason } from './types/user-session.domain.model';
import type { UserSessionDb } from './types/user-session.db';
import { UserSessionMapper } from './user-session.mapper';

@Injectable()
export class UserSessionRepository {
  private readonly tableName = 'UserSessions';

  constructor(@InjectConnection() private readonly knex: Knex) {}

  async insertSession(
    session: UserSessionDomainModel,
  ): Promise<UserSessionDomainModel> {
    const entity = UserSessionMapper.toEntity(session);
    const [sessionDb] = await this.knex<UserSessionDb>(this.tableName)
      .insert(entity)
      .returning('*');
    return UserSessionMapper.toDomainModel(sessionDb);
  }

  async getActiveSessionsByUserId(
    userId: string,
  ): Promise<UserSessionDomainModel[]> {
    const sessions = await this.knex<UserSessionDb>(this.tableName)
      .where({ userId, isActive: true })
      .where('expiresAt', '>', this.knex.fn.now())
      .orderBy('lastActivityAt', 'desc');
    return sessions.map(UserSessionMapper.toDomainModel);
  }

  async getActiveSessionByToken(
    sessionToken: string,
  ): Promise<UserSessionDomainModel | null> {
    const session = await this.knex<UserSessionDb>(this.tableName)
      .where({ sessionToken, isActive: true })
      .where('expiresAt', '>', this.knex.fn.now())
      .first();
    return session ? UserSessionMapper.toDomainModel(session) : null;
  }

  async getActiveSessionByUserIdAndDeviceId(
    userId: string,
    deviceId: string,
  ): Promise<UserSessionDomainModel | null> {
    const session = await this.knex<UserSessionDb>(this.tableName)
      .where({ userId, deviceId, isActive: true })
      .where('expiresAt', '>', this.knex.fn.now())
      .first();
    return session ? UserSessionMapper.toDomainModel(session) : null;
  }

  async updateSessionDeviceInfoAndExtendValidity(
    sessionToken: string,
    deviceInfo: SessionDeviceInfoUpdate,
    newExpiresAt: Date,
  ): Promise<UserSessionDomainModel | null> {
    const [updated] = await this.knex<UserSessionDb>(this.tableName)
      .where({ sessionToken, isActive: true })
      .update({
        deviceName: deviceInfo.deviceName,
        deviceType: deviceInfo.deviceType,
        os: deviceInfo.os,
        browser: deviceInfo.browser,
        appVersion: deviceInfo.appVersion,
        ipAddress: deviceInfo.ipAddress,
        userAgent: deviceInfo.userAgent,
        lastActivityAt: this.knex.fn.now(),
        expiresAt: newExpiresAt,
      })
      .returning('*');
    return updated ? UserSessionMapper.toDomainModel(updated) : null;
  }

  async revokeSessionByToken(
    sessionToken: string,
    reason: RevokeReason,
  ): Promise<void> {
    await this.knex<UserSessionDb>(this.tableName)
      .where({ sessionToken })
      .update({
        isActive: false,
        revokedAt: this.knex.fn.now(),
        revokeReason: reason,
      });
  }

  async revokeOtherSessionsByToken(
    userId: string,
    excludeSessionToken: string,
    reason: RevokeReason,
  ): Promise<number> {
    const result = await this.knex<UserSessionDb>(this.tableName)
      .where({ userId, isActive: true })
      .whereNot({ sessionToken: excludeSessionToken })
      .update({
        isActive: false,
        revokedAt: this.knex.fn.now(),
        revokeReason: reason,
      });
    return typeof result === 'number' ? result : 0;
  }
}
