import { Injectable } from "@nestjs/common";
import { SessionRepository } from "../../database/repositories/session.repository";
import { SessionDTO, UpdateSessionDTO } from "@gomin/common";
import { Session } from "@my-prisma/client/users";
import { IPLocationService } from "@gomin/utils";

@Injectable()
export class SessionService {
  constructor(
    private readonly sessionRepository: SessionRepository,
  ) {}

  async createSession(session: SessionDTO, userId: string): Promise<Session> {
    return this.sessionRepository.createSession({ ...session, userId });
  }

  async findSessionByDeviceNameAndUserAgent(userId: string, deviceName: string, userAgent: string): Promise<Session | null> {
    return this.sessionRepository.findSessionByDeviceNameAndUserAgent(userId, deviceName, userAgent);
  }

  async updateSession(sessionId: string, session: UpdateSessionDTO): Promise<Session> {
    if (session.ipAddress) {
      const location = IPLocationService.getUserLocation(session.ipAddress);
      session.location = `${location.city}, ${location.region}, ${location.country}`;
    }
    return this.sessionRepository.updateSession(sessionId, session);
  }

  async updateSessionToken(sessionId: string, token: string): Promise<Session> {
    return this.sessionRepository.updateSessionToken(sessionId, token);
  }

  async deleteSession(sessionId: string): Promise<Session> {
    return this.sessionRepository.deleteSession(sessionId);
  }

  async deleteAllSessionsForUser(userId: string): Promise<void> {
    return this.sessionRepository.deleteAllSessionsForUser(userId);
  }
}

