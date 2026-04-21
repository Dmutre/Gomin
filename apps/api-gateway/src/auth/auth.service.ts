import { Injectable } from '@nestjs/common';
import { Metadata } from '@grpc/grpc-js';
import { MicroserviceIdentityAuthService } from '@gomin/service-identity';
import { UserAuthGrpcClient, DeviceType } from '@gomin/grpc';
import type {
  RegisterResponse,
  LoginResponse,
  LogoutResponse,
  GetActiveSessionsResponse,
  TerminateSessionResponse,
  TerminateAllOtherSessionsResponse,
  GetUserPublicKeyResponse,
  ChangePasswordResponse,
} from '@gomin/grpc';
import type { RegisterDto } from './dto/register.dto';
import { DeviceTypeDto } from './dto/register.dto';
import type { LoginDto } from './dto/login.dto';
import type { ChangePasswordDto } from './dto/change-password.dto';
import type {
  TerminateSessionDto,
  TerminateAllOtherSessionsDto,
} from './dto/terminate-session.dto';

function toProtoDeviceType(deviceType: DeviceTypeDto): DeviceType {
  switch (deviceType) {
    case DeviceTypeDto.MOBILE:
      return DeviceType.DEVICE_TYPE_MOBILE;
    case DeviceTypeDto.DESKTOP:
      return DeviceType.DEVICE_TYPE_DESKTOP;
    case DeviceTypeDto.TABLET:
      return DeviceType.DEVICE_TYPE_TABLET;
    case DeviceTypeDto.WEB:
      return DeviceType.DEVICE_TYPE_WEB;
  }
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userAuthClient: UserAuthGrpcClient,
    private readonly identityAuthService: MicroserviceIdentityAuthService,
  ) {}

  private async buildMetadata(): Promise<Metadata> {
    const token = await this.identityAuthService.getAccessToken();
    const metadata = new Metadata();
    if (token) metadata.add('authorization', `Bearer ${token}`);
    return metadata;
  }

  async register(dto: RegisterDto, ipAddress: string): Promise<RegisterResponse> {
    const metadata = await this.buildMetadata();
    return this.userAuthClient.register(
      {
        username: dto.username,
        email: dto.email,
        password: dto.password,
        phone: dto.phone ?? '',
        e2eeKeys: dto.e2eeKeys,
        deviceInfo: {
          deviceId: dto.deviceInfo.deviceId,
          deviceName: dto.deviceInfo.deviceName,
          deviceType: toProtoDeviceType(dto.deviceInfo.deviceType),
          os: dto.deviceInfo.os,
          browser: dto.deviceInfo.browser,
          appVersion: dto.deviceInfo.appVersion,
          ipAddress,
          userAgent: dto.deviceInfo.userAgent,
        },
      },
      metadata,
    );
  }

  async login(dto: LoginDto, ipAddress: string): Promise<LoginResponse> {
    const metadata = await this.buildMetadata();
    return this.userAuthClient.login(
      {
        email: dto.email,
        password: dto.password,
        deviceInfo: {
          deviceId: dto.deviceInfo.deviceId,
          deviceName: dto.deviceInfo.deviceName,
          deviceType: toProtoDeviceType(dto.deviceInfo.deviceType),
          os: dto.deviceInfo.os,
          browser: dto.deviceInfo.browser,
          appVersion: dto.deviceInfo.appVersion,
          ipAddress,
          userAgent: dto.deviceInfo.userAgent,
        },
      },
      metadata,
    );
  }

  async logout(sessionToken: string): Promise<LogoutResponse> {
    const metadata = await this.buildMetadata();
    return this.userAuthClient.logout({ sessionToken }, metadata);
  }

  async getActiveSessions(
    sessionToken: string,
  ): Promise<GetActiveSessionsResponse> {
    const metadata = await this.buildMetadata();
    return this.userAuthClient.getActiveSessions({ sessionToken }, metadata);
  }

  async terminateSession(
    sessionToken: string,
    dto: TerminateSessionDto,
  ): Promise<TerminateSessionResponse> {
    const metadata = await this.buildMetadata();
    return this.userAuthClient.terminateSession(
      {
        sessionToken,
        targetSessionToken: dto.targetSessionToken,
        password: dto.password,
      },
      metadata,
    );
  }

  async terminateAllOtherSessions(
    sessionToken: string,
    dto: TerminateAllOtherSessionsDto,
  ): Promise<TerminateAllOtherSessionsResponse> {
    const metadata = await this.buildMetadata();
    return this.userAuthClient.terminateAllOtherSessions(
      { sessionToken, password: dto.password },
      metadata,
    );
  }

  async getUserPublicKey(
    sessionToken: string,
    targetUserId: string,
  ): Promise<GetUserPublicKeyResponse> {
    const metadata = await this.buildMetadata();
    return this.userAuthClient.getUserPublicKey(
      { sessionToken, targetUserId },
      metadata,
    );
  }

  async changePassword(
    sessionToken: string,
    dto: ChangePasswordDto,
  ): Promise<ChangePasswordResponse> {
    const metadata = await this.buildMetadata();
    return this.userAuthClient.changePassword(
      {
        sessionToken,
        currentPassword: dto.currentPassword,
        newPassword: dto.newPassword,
        e2eeKeys: dto.e2eeKeys,
      },
      metadata,
    );
  }
}
