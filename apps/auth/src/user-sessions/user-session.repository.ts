import { Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { InjectConnection } from 'nest-knexjs';
import type { UserSessionDomainModel } from './types/user-session.domain.model';
import { RevokeReason } from './types/user-session.domain.model';
import type { UserSessionDb } from './types/user-session.db';
import { UserSessionMapper } from './user-session.mapper';

@Injectable()
export class UserSessionRepository {
  private readonly tableName = 'UserSessions';

  constructor(@InjectConnection() private readonly knex: Knex) {}

  async createSession(session: UserSessionDomainModel): Promise<UserSessionDomainModel> {
    const entity = UserSessionMapper.toEntity(session);
    const [sessionDb] = await this.knex<UserSessionDb>(this.tableName)
      .insert(entity)
      .returning('*');
    return UserSessionMapper.toDomainModel(sessionDb);
  }

  async findByUserId(userId: string): Promise<UserSessionDomainModel[]> {
    const sessions = await this.knex<UserSessionDb>(this.tableName)
      .where({ userId, isActive: true })
      .where('expiresAt', '>', this.knex.fn.now())
      .orderBy('lastActivityAt', 'desc');
    return sessions.map(UserSessionMapper.toDomainModel);
  }

  async findById(sessionId: string): Promise<UserSessionDomainModel | null> {
    const session = await this.knex<UserSessionDb>(this.tableName)
      .where({ id: sessionId, isActive: true })
      .where('expiresAt', '>', this.knex.fn.now())
      .first();
    return session ? UserSessionMapper.toDomainModel(session) : null;
  }

  async revokeSession(sessionId: string, reason: RevokeReason): Promise<void> {
    await this.knex<UserSessionDb>(this.tableName)
      .where({ id: sessionId })
      .update({ isActive: false, revokedAt: this.knex.fn.now(), revokeReason: reason });
  }

  async revokeAllSessionsByUserId(userId: string, excludeSessionId: string, reason: RevokeReason): Promise<number> {
    const result = await this.knex<UserSessionDb>(this.tableName)
      .where({ userId, isActive: true })
      .whereNot({ id: excludeSessionId })
      .update({ isActive: false, revokedAt: this.knex.fn.now(), revokeReason: reason });
    return typeof result === 'number' ? result : 0;
  }
}
