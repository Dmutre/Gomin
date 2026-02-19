import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { UserService } from '../users/user.service';
import { UserSessionService } from '../user-sessions/user-session.service';
import { CreateSessionParams } from '../user-sessions/types/user-session.domain.model';
import { RevokeReason } from '../user-sessions/types/user-session.domain.model';
import type {
  RegisterResponse,
  LoginResponse,
  LogoutResponse,
  GetActiveSessionsResponse,
  TerminateSessionResponse,
  TerminateAllOtherSessionsResponse,
} from '@gomin/grpc';
import { toUserProfile, toSessionInfo } from './auth.mapper';
import type {
  RegisterDto,
  LoginDto,
  LogoutDto,
  GetActiveSessionsDto,
  TerminateSessionDto,
  TerminateAllOtherSessionsDto,
  DeviceInfoDto,
} from './dto';
import { UserDomainModel } from '../users/types/user.domain.model';

// TODO: Add caching so service would works more efficiently
@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly userSessionService: UserSessionService,
  ) {}

  // TODO: Add mock for email confirmation
  async register(
    data: RegisterDto,
  ): Promise<RegisterResponse> {
    const user = await this.registerUser(data);
    const session = await this.createSession(user.id, data.deviceInfo);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return {
      user: toUserProfile(user),
      sessionToken: session.token,
      sessionId: session.id,
      expiresAt,
    };
  }

  private async registerUser(data: RegisterDto): Promise<UserDomainModel> {
    const existingUser = await this.userService.findByEmail(data.email);
    if (existingUser) {
      throw new UnauthorizedException('Email already registered'); //TODO: Rework exceptions to use custom RPC exception with filters and so on
    }
    const passwordHash = this.hashPassword(data.password);

    return await this.userService.createUser({
      id: randomUUID(),
      username: data.username,
      email: data.email,
      phone: data.phone ?? null,
      passwordHash,
      publicKey: data.e2eeKeys?.publicKey ?? null,
      encryptedPrivateKey: data.e2eeKeys?.encryptedPrivateKey ?? null,
      encryptionSalt: data.e2eeKeys?.encryptionSalt ?? null,
      encryptionIv: data.e2eeKeys?.encryptionIv ?? null,
      encryptionAuthTag: data.e2eeKeys?.encryptionAuthTag ?? null,
      avatarUrl: null,
      bio: null,
      emailVerified: false,
      phoneVerified: false,
      isActive: true,
      isBanned: false,
      bannedAt: null,
      banReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async login(
    data: LoginDto,
  ): Promise<LoginResponse> {
    const user = await this.userService.findByEmail(data.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isValid = this.verifyPassword(data.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const session = await this.createSession(user.id, data.deviceInfo);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return {
      user: toUserProfile(user),
      sessionToken: session.token,
      sessionId: session.id,
      expiresAt,
      e2eeKeys: user.publicKey
        ? {
            publicKey: user.publicKey,
            encryptedPrivateKey: user.encryptedPrivateKey ?? '',
            encryptionSalt: user.encryptionSalt ?? '',
            encryptionIv: user.encryptionIv ?? '',
            encryptionAuthTag: user.encryptionAuthTag ?? '',
          }
        : undefined,
    };
  }

  async logout(data: LogoutDto): Promise<LogoutResponse> {
    const session = await this.userSessionService.findById(data.sessionId);
    if (session) {
      await this.userSessionService.revokeSession(session.id, RevokeReason.USER_LOGOUT);
    }
    return { success: true };
  }

  async getActiveSessions(data: GetActiveSessionsDto): Promise<GetActiveSessionsResponse> {
    const session = await this.userSessionService.findById(data.sessionId);
    if (!session) {
      throw new UnauthorizedException('Invalid session');
    }
    const sessions = await this.userSessionService.findByUserId(session.userId);
    return {
      sessions: sessions.map((s) =>
        toSessionInfo(s, s.id === session.id),
      ),
    };
  }

  async terminateSession(data: TerminateSessionDto): Promise<TerminateSessionResponse> {
    const session = await this.userSessionService.findById(data.sessionId);
    if (!session) {
      throw new UnauthorizedException('Invalid session');
    }
    const user = await this.userService.findById(session.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const isValid = this.verifyPassword(data.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid password');
    }
    const sessions = await this.userSessionService.findByUserId(session.userId);
    const targetSession = sessions.find((s) => s.id === data.targetSessionId);
    if (!targetSession) {
      throw new UnauthorizedException('Session not found');
    }
    await this.userSessionService.revokeSession(data.targetSessionId, RevokeReason.USER_TERMINATED);
    return { success: true };
  }

  async terminateAllOtherSessions(
    data: TerminateAllOtherSessionsDto,
  ): Promise<TerminateAllOtherSessionsResponse> {
    const session = await this.userSessionService.findById(data.currentSessionId);
    if (!session) {
      throw new UnauthorizedException('Invalid session');
    }
    const user = await this.userService.findById(session.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const isValid = this.verifyPassword(data.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid password');
    }
    const count = await this.userSessionService.revokeAllOtherSessions(
      session.userId,
      session.id,
      RevokeReason.USER_TERMINATED_ALL,
    );
    return { terminatedCount: count };
  }

  private async createSession(
    userId: string,
    deviceInfo: DeviceInfoDto,
  ): Promise<{ id: string; token: string }> {
    const sessionCreateParams: CreateSessionParams = {
      userId,
      deviceId: deviceInfo.deviceId,
      deviceName: deviceInfo.deviceName,
      deviceType: deviceInfo.deviceType,
      os: deviceInfo.os,
      browser: deviceInfo.browser,
      appVersion: deviceInfo.appVersion,
      ipAddress: deviceInfo.ipAddress,
      country: null,
      city: null,
      userAgent: deviceInfo.userAgent,
    };
    const { session, token } =await this.userSessionService.createSession(sessionCreateParams);
    return { id: session.id, token };
  }

  private hashPassword(password: string): string {
    return createHash('sha256').update(password).digest('hex');
  }

  private verifyPassword(password: string, hash: string): boolean {
    return this.hashPassword(password) === hash;
  }
}
