import { Injectable } from '@nestjs/common';
import { SESSION_FULL_INCLUDE, SessionFull, UsersPrismaService } from '@gomin/users-db';
import { Session, Prisma } from '@my-prisma/client/users';

@Injectable()
export class SessionRepository {
  constructor(private readonly prisma: UsersPrismaService) {}

  async createSession(data: Prisma.SessionUncheckedCreateInput): Promise<Session> {
    return this.prisma.session.create({ data });
  }

  async findSessionByDeviceNameAndUserAgent(userId: string, deviceName: string, userAgent: string): Promise<Session | null> {
    return this.prisma.session.findFirst({
      where: {
        userId,
        deviceName,
        userAgent,
      },
    }); 
  }

  async findSessionById(id: string): Promise<SessionFull | null> {
    return this.prisma.session.findUnique({ where: { id }, ...SESSION_FULL_INCLUDE });
  }

  async findSessionsByUser(userId: string): Promise<Session[]> {
    return this.prisma.session.findMany({ where: { userId } });
  }

  async findSessionByTokenAndUserId(token: string, userId: string): Promise<Session | null> {
    return this.prisma.session.findFirst({ where: { token: { value: token, userId } } });
  }

  async updateSession(id: string, data: Prisma.SessionUncheckedUpdateInput): Promise<Session> {
    return this.prisma.session.update({ where: { id }, data });
  }

  async updateSessionToken(sessionId: string, tokenData: Prisma.TokenUncheckedUpdateInput): Promise<SessionFull> {
    return this.prisma.session.update({ where: { id: sessionId }, data: { token: { update: tokenData } }, ...SESSION_FULL_INCLUDE });
  }

  async createSessionToken(sessionId: string, tokenData: Prisma.TokenUncheckedCreateInput): Promise<SessionFull> {
    return this.prisma.session.update({ where: { id: sessionId }, data: { token: { create: tokenData } }, ...SESSION_FULL_INCLUDE });
  }

  async deleteSession(id: string): Promise<Session> {
    return this.prisma.session.delete({ where: { id }, });
  }

  async deleteAllSessionsForUser(userId: string): Promise<void> {
    await this.prisma.session.deleteMany({ where: { userId } });
  }
}
