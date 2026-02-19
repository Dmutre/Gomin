import { Injectable } from '@nestjs/common';
import { UserSessionRepository } from './user-session.repository';
import type { CreateSessionParams, UserSessionDomainModel } from './types/user-session.domain.model';
import { RevokeReason } from './types/user-session.domain.model';
import { createHash, randomBytes, randomUUID } from 'crypto';

@Injectable()
export class UserSessionService {
  private readonly sessionExpirationTime = 30 * 24 * 60 * 60 * 1000; // 60 days

  constructor(private readonly userSessionRepository: UserSessionRepository) {}

  async createSession(session: CreateSessionParams): Promise<{ session: UserSessionDomainModel, token: string }> {
    const token = randomBytes(32).toString('hex');
    const sessionTokenHash = await this.hashToken(token);
    const sessionModel: UserSessionDomainModel = {
      ...session,
      id: randomUUID(),
      sessionTokenHash,
      isActive: true,
      createdAt: new Date(),
      lastActivityAt: new Date(),
      expiresAt: new Date(Date.now() + this.sessionExpirationTime),
      revokedAt: null,
      revokeReason: null,
    };
    
    const createdSession = await this.userSessionRepository.createSession(sessionModel);

    return { session: createdSession, token };
  }

  private async hashToken(token: string): Promise<string> {
    return createHash('sha256').update(token).digest('hex');
  }

  async findById(sessionId: string): Promise<UserSessionDomainModel | null> {
    return this.userSessionRepository.findById(sessionId);
  }

  async findByUserId(userId: string): Promise<UserSessionDomainModel[]> {
    return this.userSessionRepository.findByUserId(userId);
  }

  async revokeSession(sessionId: string, reason: RevokeReason = RevokeReason.USER_TERMINATED): Promise<void> {
    return this.userSessionRepository.revokeSession(sessionId, reason);
  }

  async revokeAllOtherSessions(
    userId: string,
    excludeSessionId: string,
    reason: RevokeReason = RevokeReason.USER_TERMINATED_ALL,
  ): Promise<number> {
    return this.userSessionRepository.revokeAllSessionsByUserId(userId, excludeSessionId, reason);
  }
}
