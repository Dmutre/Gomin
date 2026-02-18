import { Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { InjectConnection } from 'nest-knexjs';
import type { UserSessionDomainModel } from './types/user-session.domain.model';
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
}
