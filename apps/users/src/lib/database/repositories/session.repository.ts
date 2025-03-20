import { Injectable } from '@nestjs/common';
import { UsersPrismaService } from '@gomin/users-db';
import { Session, Prisma } from '@my-prisma/client/users';

@Injectable()
export class SessionRepository {
  constructor(private readonly prisma: UsersPrismaService) {}

  async createSession(data: Prisma.SessionUncheckedCreateInput): Promise<Session> {
    return this.prisma.session.create({ data });
  }

  async findSessionById(id: string): Promise<Session | null> {
    return this.prisma.session.findUnique({ where: { id } });
  }

  async findSessionsByUser(userId: string): Promise<Session[]> {
    return this.prisma.session.findMany({ where: { userId } });
  }

  async deleteSession(id: string): Promise<Session> {
    return this.prisma.session.delete({ where: { id } });
  }

  async deleteAllSessionsForUser(userId: string): Promise<void> {
    await this.prisma.session.deleteMany({ where: { userId } });
  }
}
