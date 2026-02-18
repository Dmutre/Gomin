import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { UserService } from '../users/user.service';
import { UserSessionService } from '../user-sessions/user-session.service';
import type { UserSessionDomainModel } from '../user-sessions/types/user-session.domain.model';
import type { LoginRequest } from '@gomin/grpc';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly userSessionService: UserSessionService,
  ) {}

  async login(request: LoginRequest, context?: { ip?: string; userAgent?: string }): Promise<{ sessionToken: string }> {
    const user = await this.userService.findByUsername(request.username);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // TODO: Add bcrypt - const isValid = await bcrypt.compare(request.password, user.passwordHash);
    const isValid = this.verifyPassword(request.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const sessionToken = randomBytes(32).toString('hex');
    const sessionTokenHash = this.hashToken(sessionToken);

    const session: UserSessionDomainModel = {
      id: randomUUID(),
      userId: user.id,
      sessionTokenHash,
      deviceId: null,
      deviceName: null,
      deviceType: null,
      os: null,
      browser: null,
      appVersion: null,
      ipAddress: context?.ip ?? '0.0.0.0',
      country: null,
      city: null,
      userAgent: context?.userAgent ?? null,
      createdAt: new Date(),
      lastActivityAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      isActive: true,
      revokedAt: null,
      revokeReason: null,
    };

    await this.userSessionService.createSession(session);

    return { sessionToken };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /** TODO: Replace with bcrypt.compare when bcrypt is added */
  private verifyPassword(password: string, hash: string): boolean {
    // Placeholder - implement proper bcrypt verification
    return password.length > 0 && hash.length > 0;
  }
}
