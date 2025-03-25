import { HttpStatus, Injectable } from "@nestjs/common";
import { SessionRepository } from "../../database/repositories/session.repository";
import { MicroserviceException, SessionDTO, TIME_CONSTANTS, UpdateSessionDTO } from "@gomin/common";
import { Session } from "@my-prisma/client/users";
import { IPLocationService } from "@gomin/utils";
import { TokenService } from "../../../api/tokens/token.service";
import { SessionFull } from "@gomin/users-db";

@Injectable()
export class SessionService {
  private readonly DAY = TIME_CONSTANTS.DAY;

  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly tokenService: TokenService,
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

  async updateSessionToken(sessionId: string, tokenValue: string): Promise<SessionFull> {
    let session: SessionFull | null = await this.sessionRepository.findSessionById(sessionId);
  
    if (!session) {
      throw new Error('Session not found');
    }
  
    const expiresAt = new Date(Date.now() + session.user.userSetting.sessionDuration * this.DAY);
  
    if (session.token) {
      session = await this.sessionRepository.updateSessionToken(sessionId, {
        value: tokenValue,
        expiresAt,
      });
    } else {
      session = await this.sessionRepository.createSessionToken(sessionId, {
        value: tokenValue,
        type: 'SESSION',
        userId: session.userId,
        expiresAt,
      });
    }
  
    return session;
  }

  async deleteSession(sessionId: string): Promise<Session> {
    await this.tokenService.deleteSessionToken(sessionId);
    return this.sessionRepository.deleteSession(sessionId);
  }

  async findSessionsByUser(userId: string): Promise<Session[]> {
    return this.sessionRepository.findSessionsByUser(userId);
  }

  async deleteAllSessionsForUser(userId: string): Promise<void> {
    return this.sessionRepository.deleteAllSessionsForUser(userId);
  }

  async findSessionByTokenAndUserId(token: string, userId: string): Promise<Session | null> {
    return this.sessionRepository.findSessionByTokenAndUserId(token, userId);
  }

  async findSessionById(sessionId: string): Promise<Session | null> {
    return this.sessionRepository.findSessionById(sessionId);
  }

  async findOrThrowSessionById(sessionId: string): Promise<Session> {
    const session = await this.findSessionById(sessionId);
    if (!session) {
      throw new MicroserviceException('Session not found', HttpStatus.NOT_FOUND);
    }
    return session;
  }
}

