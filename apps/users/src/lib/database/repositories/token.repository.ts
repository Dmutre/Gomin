import { Injectable } from '@nestjs/common';
import { UsersPrismaService } from '@gomin/users-db';
import { Token, Prisma } from '@prisma/client/users';

@Injectable()
export class TokenRepository {
  constructor(private readonly prisma: UsersPrismaService) {}

  async createToken(data: Prisma.TokenUncheckedCreateInput): Promise<Token> {
    return this.prisma.token.create({ data });
  }

  async findTokenByValue(value: string): Promise<Token | null> {
    return this.prisma.token.findFirst({ where: { value } });
  }

  async deleteToken(id: string): Promise<Token> {
    return this.prisma.token.delete({ where: { id } });
  }

  async deleteExpiredTokens(): Promise<void> {
    await this.prisma.token.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }
}
