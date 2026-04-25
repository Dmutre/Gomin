import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { LogAllMethods, MicroserviceException } from '@gomin/app';
import { status } from '@grpc/grpc-js';
import * as argon2 from 'argon2';
import { randomUUID } from 'crypto';
import { maskFields } from '@gomin/logger';
import { UserService } from '../users/user.service';
import { UserSessionService } from '../user-sessions/user-session.service';
import { CreateSessionParams } from '../user-sessions/types/user-session.domain.model';
import { RevokeReason } from '../user-sessions/types/user-session.domain.model';
import { USER_SENSITIVE_FIELDS } from '../users/types/user.domain.model';
import type {
  RegisterResponse,
  LoginResponse,
  LogoutResponse,
  GetActiveSessionsResponse,
  TerminateSessionResponse,
  TerminateAllOtherSessionsResponse,
  GetUserPublicKeyResponse,
  ChangePasswordResponse,
  ValidateSessionResponse,
} from '@gomin/grpc';
import {
  toUserProfile,
  toSessionInfo,
  mapProtoDeviceTypeToDomain,
} from './user-auth.mapper';
import type {
  RegisterDto,
  LoginDto,
  LogoutDto,
  GetActiveSessionsDto,
  TerminateSessionDto,
  TerminateAllOtherSessionsDto,
  DeviceInfoDto,
  GetUserPublicKeyDto,
  ChangePasswordDto,
} from './dto';
import type { UserDomainModel } from '../users/types/user.domain.model';
import { AuthMetricsService } from '../metrics/auth.metrics.service';

@LogAllMethods()
@Injectable()
export class UserAuthService {
  constructor(
    private readonly userService: UserService,
    private readonly userSessionService: UserSessionService,
    private readonly authMetrics: AuthMetricsService,
    private readonly logger: PinoLogger,
  ) {}

  async register(data: RegisterDto): Promise<RegisterResponse> {
    const existingUser = await this.userService.findByEmail(data.email);
    if (existingUser) {
      throw new MicroserviceException(
        'Email already registered',
        status.ALREADY_EXISTS,
      );
    }

    const passwordHash = await this.hashPassword(data.password);

    const user = await this.userService.createUser({
      id: randomUUID(),
      username: data.username,
      email: data.email,
      phone: data.phone || null,
      passwordHash,
      publicKey: data.e2eeKeys.publicKey,
      encryptedPrivateKey: data.e2eeKeys.encryptedPrivateKey,
      encryptionSalt: data.e2eeKeys.encryptionSalt,
      encryptionIv: data.e2eeKeys.encryptionIv,
      encryptionAuthTag: data.e2eeKeys.encryptionAuthTag,
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

    this.logger.info({ user: maskFields(user, USER_SENSITIVE_FIELDS) }, 'User registered');

    const session = await this.userSessionService.createNewSession(
      this.toCreateSessionParams(user.id, data.deviceInfo),
    );

    this.authMetrics.recordRegistration();
    this.authMetrics.recordSessionCreated();
    return {
      user: toUserProfile(user),
      sessionToken: session.sessionToken,
      expiresAt: session.expiresAt,
    };
  }

  async login(data: LoginDto): Promise<LoginResponse> {
    const user = await this.userService.findByEmail(data.email);
    if (!user) {
      throw new MicroserviceException(
        'Invalid credentials',
        status.UNAUTHENTICATED,
      );
    }

    const isValid = await this.verifyPassword(data.password, user.passwordHash);
    if (!isValid) {
      throw new MicroserviceException(
        'Invalid credentials',
        status.UNAUTHENTICATED,
      );
    }

    const sessionParams = this.toCreateSessionParams(user.id, data.deviceInfo);
    const session =
      await this.userSessionService.getOrCreateSessionForDevice(sessionParams);

    this.authMetrics.recordLogin();
    return {
      user: toUserProfile(user),
      sessionToken: session.sessionToken,
      expiresAt: session.expiresAt,
      e2eeKeys: this.buildE2eeKeysResponse(user),
    };
  }

  async logout(data: LogoutDto): Promise<LogoutResponse> {
    const session = await this.userSessionService.getActiveSessionByToken(
      data.sessionToken,
    );
    if (session) {
      await this.userSessionService.revokeSessionByToken(
        data.sessionToken,
        RevokeReason.USER_LOGOUT,
      );
    }
    return { success: true };
  }

  async getActiveSessions(
    data: GetActiveSessionsDto,
  ): Promise<GetActiveSessionsResponse> {
    const session = await this.userSessionService.getActiveSessionByToken(
      data.sessionToken,
    );
    if (!session) {
      throw new MicroserviceException(
        'Invalid session',
        status.UNAUTHENTICATED,
      );
    }
    const sessions = await this.userSessionService.getActiveSessionsByUserId(
      session.userId,
    );
    return {
      sessions: sessions.map((s) =>
        toSessionInfo(s, s.sessionToken === session.sessionToken),
      ),
    };
  }

  async terminateSession(
    data: TerminateSessionDto,
  ): Promise<TerminateSessionResponse> {
    const session = await this.userSessionService.getActiveSessionByToken(
      data.sessionToken,
    );
    if (!session) {
      throw new MicroserviceException(
        'Invalid session',
        status.UNAUTHENTICATED,
      );
    }
    const user = await this.userService.findById(session.userId);
    if (!user) {
      throw new MicroserviceException('User not found', status.NOT_FOUND);
    }
    const isValid = await this.verifyPassword(data.password, user.passwordHash);
    if (!isValid) {
      throw new MicroserviceException(
        'Invalid password',
        status.UNAUTHENTICATED,
      );
    }
    const sessions = await this.userSessionService.getActiveSessionsByUserId(
      session.userId,
    );
    const targetSession = sessions.find(
      (s) => s.sessionToken === data.targetSessionToken,
    );
    if (!targetSession) {
      throw new MicroserviceException('Session not found', status.NOT_FOUND);
    }
    await this.userSessionService.revokeSessionByToken(
      data.targetSessionToken,
      RevokeReason.USER_TERMINATED,
    );
    return { success: true };
  }

  async terminateAllOtherSessions(
    data: TerminateAllOtherSessionsDto,
  ): Promise<TerminateAllOtherSessionsResponse> {
    const session = await this.userSessionService.getActiveSessionByToken(
      data.sessionToken,
    );
    if (!session) {
      throw new MicroserviceException(
        'Invalid session',
        status.UNAUTHENTICATED,
      );
    }
    const user = await this.userService.findById(session.userId);
    if (!user) {
      throw new MicroserviceException('User not found', status.NOT_FOUND);
    }
    const isValid = await this.verifyPassword(data.password, user.passwordHash);
    if (!isValid) {
      throw new MicroserviceException(
        'Invalid password',
        status.UNAUTHENTICATED,
      );
    }
    const count = await this.userSessionService.revokeOtherSessionsByToken(
      session.userId,
      session.sessionToken,
      RevokeReason.USER_TERMINATED_ALL,
    );
    this.authMetrics.recordSessionsTerminated(count);
    return { terminatedCount: count };
  }

  async getUserPublicKey(
    data: GetUserPublicKeyDto,
  ): Promise<GetUserPublicKeyResponse> {
    const session = await this.userSessionService.getActiveSessionByToken(
      data.sessionToken,
    );
    if (!session) {
      throw new MicroserviceException(
        'Invalid session',
        status.UNAUTHENTICATED,
      );
    }
    const target = await this.userService.findById(data.targetUserId);
    if (!target) {
      throw new MicroserviceException('User not found', status.NOT_FOUND);
    }
    return { publicKey: target.publicKey ?? '' };
  }

  async changePassword(
    data: ChangePasswordDto,
  ): Promise<ChangePasswordResponse> {
    const session = await this.userSessionService.getActiveSessionByToken(
      data.sessionToken,
    );
    if (!session) {
      throw new MicroserviceException(
        'Invalid session',
        status.UNAUTHENTICATED,
      );
    }
    const user = await this.userService.findById(session.userId);
    if (!user) {
      throw new MicroserviceException('User not found', status.NOT_FOUND);
    }
    const isValid = await this.verifyPassword(
      data.currentPassword,
      user.passwordHash,
    );
    if (!isValid) {
      throw new MicroserviceException(
        'Invalid credentials',
        status.UNAUTHENTICATED,
      );
    }
    await this.userSessionService.revokeOtherSessionsByToken(
      user.id,
      session.sessionToken,
      RevokeReason.USER_PASSWORD_CHANGED,
    );
    await this.userService.updateUser(user.id, {
      passwordHash: await this.hashPassword(data.newPassword),
      publicKey: data.e2eeKeys.publicKey,
      encryptedPrivateKey: data.e2eeKeys.encryptedPrivateKey,
      encryptionSalt: data.e2eeKeys.encryptionSalt,
      encryptionIv: data.e2eeKeys.encryptionIv,
      encryptionAuthTag: data.e2eeKeys.encryptionAuthTag,
    });
    this.authMetrics.recordPasswordChanged();
    return { success: true };
  }

  private toCreateSessionParams(
    userId: string,
    deviceInfo: DeviceInfoDto,
  ): CreateSessionParams {
    return {
      userId,
      deviceId: deviceInfo.deviceId,
      deviceName: deviceInfo.deviceName,
      deviceType: mapProtoDeviceTypeToDomain(deviceInfo.deviceType),
      os: deviceInfo.os,
      browser: deviceInfo.browser,
      appVersion: deviceInfo.appVersion,
      ipAddress: deviceInfo.ipAddress,
      country: null,
      city: null,
      userAgent: deviceInfo.userAgent,
    };
  }

  async validateSession(
    sessionToken: string,
  ): Promise<ValidateSessionResponse> {
    const session =
      await this.userSessionService.getActiveSessionByToken(sessionToken);
    if (!session) {
      return { valid: false, userId: '', username: '', email: '' };
    }
    const user = await this.userService.findById(session.userId);
    if (!user) {
      return { valid: false, userId: '', username: '', email: '' };
    }
    return {
      valid: true,
      userId: user.id,
      username: user.username,
      email: user.email,
    };
  }

  private async hashPassword(password: string): Promise<string> {
    return argon2.hash(password);
  }

  private async verifyPassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  private buildE2eeKeysResponse(user: UserDomainModel):
    | {
        publicKey: string;
        encryptedPrivateKey: string;
        encryptionSalt: string;
        encryptionIv: string;
        encryptionAuthTag: string;
      }
    | undefined {
    if (
      !user.publicKey ||
      !user.encryptedPrivateKey ||
      !user.encryptionSalt ||
      !user.encryptionIv ||
      !user.encryptionAuthTag
    ) {
      return undefined;
    }
    return {
      publicKey: user.publicKey,
      encryptedPrivateKey: user.encryptedPrivateKey,
      encryptionSalt: user.encryptionSalt,
      encryptionIv: user.encryptionIv,
      encryptionAuthTag: user.encryptionAuthTag,
    };
  }
}
