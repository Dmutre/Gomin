import { HttpStatus, Injectable } from "@nestjs/common";
import { TokenRepository } from "../database/repositories/token.repository";
import { randomBytes } from 'crypto';
import { TokenType, Prisma, Token } from "@my-prisma/client/users";
import { MicroserviceException, TIME_CONSTANTS } from "@gomin/common";
import * as speakeasy from 'speakeasy';

@Injectable()
export class TokenService {
  private readonly EMAIL_TOKEN_EXPIRATION_TIME = TIME_CONSTANTS.MINUTE * 10;
  private readonly PASSWORD_RESET_TOKEN_EXPIRATION_TIME = TIME_CONSTANTS.MINUTE * 10;
  private readonly MINUTE = TIME_CONSTANTS.MINUTE;
  private readonly TWO_FA_TOKEN_EXPIRATION_TIME = TIME_CONSTANTS.MINUTE * 10;
  private readonly DAY = TIME_CONSTANTS.DAY;

  constructor(private readonly tokenRepository: TokenRepository) {}

  async generateEmailVerificationToken(userId: string): Promise<string> {
    await this.ensureRequestNotTooFrequent({
      type: TokenType.EMAIL,
      user: { id: userId }
    })
    
    const token = this.generateRandomToken()
    await this.tokenRepository.createToken({
      value: token,
      type: TokenType.EMAIL,
      userId,
      expiresAt: new Date(Date.now() + this.EMAIL_TOKEN_EXPIRATION_TIME),
    })

    return token
  }

  generateSessionToken(): string {
    return this.generateRandomToken()
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

  private async ensureRequestNotTooFrequent(
    where: Prisma.TokenWhereInput,
    options?: {
      minTimeMs?: number
      skipUpdatedCheck?: boolean
    }
  ) {
    const { minTimeMs = this.MINUTE, skipUpdatedCheck = true } = options ?? {}
  
    const dbToken = await this.tokenRepository.find({
      where,
      orderBy: { createdAt: 'desc' },
    })
  
    if (!dbToken) return
  
    const tooSoon = Date.now() - dbToken.createdAt.getTime() < minTimeMs
    const updatedTooRecently = !skipUpdatedCheck && dbToken.updatedAt > new Date(Date.now() - minTimeMs)
  
    if (tooSoon || updatedTooRecently) {
      throw new MicroserviceException('Too many requests', HttpStatus.BAD_REQUEST)
    }
  }
  

  async deleteSessionToken(sessionId: string): Promise<void> {
    await this.tokenRepository.deleteTokenBySessionId(sessionId);
  }

  private async makeTokenPermanent(token: Token): Promise<void> {
    await this.tokenRepository.update({
      where: { id: token.id },
      data: { expiresAt: null },
    });
  }

  async generate2FAToken(userId: string): Promise<string> {
    await this.ensureRequestNotTooFrequent(
      { type: TokenType.TWO_FA, userId },
      { skipUpdatedCheck: false }
    )
    const secret = speakeasy.generateSecret({ length: 20, name: 'Gomin' })

    const existing = await this.tokenRepository.find({
      where: { userId, type: TokenType.TWO_FA },
    })

    if (existing) {
      await this.update2FAToken(existing.id, secret.base32)
    } else {
      await this.create2FAToken(userId, secret.base32)
    }

    return secret.otpauth_url
  }

  private async create2FAToken(userId: string, secret: string): Promise<void> {
    await this.tokenRepository.createToken({
      value: secret,
      type: TokenType.TWO_FA,
      userId,
      expiresAt: new Date(Date.now() + this.TWO_FA_TOKEN_EXPIRATION_TIME),
    })
  }

  private async update2FAToken(tokenId: string, secret: string): Promise<void> {
    await this.tokenRepository.update({
      where: { id: tokenId, type: TokenType.TWO_FA },
      data: {
        value: secret,
        expiresAt: new Date(Date.now() + this.TWO_FA_TOKEN_EXPIRATION_TIME),
      },
    })
  }

  async verify2FAToken(userId: string, code: string): Promise<void> {
    const token = await this.tokenRepository.find({
      where: { userId, type: TokenType.TWO_FA },
    })

    if (!token) {
      throw new MicroserviceException('Invalid or expired token', HttpStatus.BAD_REQUEST)
    }

    if (token.expiresAt && token.expiresAt < new Date()) {
      throw new MicroserviceException('Token expired', HttpStatus.BAD_REQUEST)
    }

    const verified = speakeasy.totp.verify({
      token: code,
      secret: token.value,
      encoding: 'base32',
      window: 1,
    })

    if (!verified) {
      throw new MicroserviceException('Invalid code', HttpStatus.BAD_REQUEST)
    }

    if (!token.expiresAt) return

    await this.makeTokenPermanent(token)
  }

  async verifyOrThrowSessionToken(value: string): Promise<string> {
    const token = await this.tokenRepository.find({ where: { value, type: TokenType.SESSION } });
    if (!token || token.expiresAt < new Date()) {
      throw new MicroserviceException('Invalid or expired token', HttpStatus.BAD_REQUEST);
    }
    return token.userId;
  }
}

