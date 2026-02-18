import { Injectable } from '@nestjs/common';
import { UserSessionRepository } from './user-session.repository';
import type { UserSessionDomainModel } from './types/user-session.domain.model';

@Injectable()
export class UserSessionService {
  constructor(private readonly userSessionRepository: UserSessionRepository) {}

  async createSession(session: UserSessionDomainModel): Promise<UserSessionDomainModel> {
    return this.userSessionRepository.createSession(session);
  }

  async findByUserId(userId: string): Promise<UserSessionDomainModel[]> {
    return this.userSessionRepository.findByUserId(userId);
  }
}
