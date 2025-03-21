import { HttpStatus, Injectable } from "@nestjs/common";
import { TokenRepository } from "../../lib/database/repositories/token.repository";
import { randomBytes } from 'crypto';
import { TokenType } from "@my-prisma/client/users";
import { MicroserviceException } from "@gomin/common";
import { TIME_CONSTANTS } from "@gomin/common";
import { Prisma } from "@my-prisma/client/users";

@Injectable()
export class TokenService {
  private readonly EMAIL_TOKEN_EXPIRATION_TIME = TIME_CONSTANTS.MINUTE * 10;
  private readonly PASSWORD_RESET_TOKEN_EXPIRATION_TIME = TIME_CONSTANTS.MINUTE * 10;
  private readonly MINUTE = TIME_CONSTANTS.MINUTE;
  
  constructor(private readonly tokenRepository: TokenRepository) {}

  async generateEmailVerificationToken(userId: string): Promise<string> {
    await this.checkRequestsFrequency({ id: userId }, TokenType.EMAIL);
    const token = this.generateRandomToken();
    await this.tokenRepository.createToken({
      value: token,
      type: TokenType.EMAIL,
      userId,
      expiresAt: new Date(Date.now() + this.EMAIL_TOKEN_EXPIRATION_TIME),
    });
    return token;
  }

  async verifyOrThrowEmailToken(value: string): Promise<string> {
    const token = await this.tokenRepository.findTokenByValue(value);
    if (!token || token.expiresAt < new Date()) {
      throw new MicroserviceException('Invalid or expired token', HttpStatus.BAD_REQUEST);
    }
    return token.userId;
  }

  private generateRandomToken(length = 32): string {
    return randomBytes(length).toString('hex');
  }

  async checkRequestsFrequency(user: Prisma.UserWhereUniqueInput, type: TokenType) {
    const dbToken = await this.tokenRepository.find({
      where: {
        type,
        user,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (dbToken && Date.now() - dbToken.createdAt.getTime() < this.MINUTE) {
      throw new MicroserviceException(
        'Too many requests',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async deleteSessionToken(sessionId: string): Promise<void> {
    await this.tokenRepository.deleteTokenBySessionId(sessionId);
  }
}

