import { Controller, UseGuards } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { LocalIdentityGuard } from '../local-identity/local-identity.guard';
import { Permission, RequirePermission } from '@gomin/service-identity';
import { UserAuthService } from './user-auth.service';
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
  RegisterDto,
  LoginDto,
  LogoutDto,
  GetActiveSessionsDto,
  TerminateSessionDto,
  TerminateAllOtherSessionsDto,
  GetUserPublicKeyDto,
  ChangePasswordDto,
} from './dto';

@Controller()
@UseGuards(LocalIdentityGuard)
export class UserAuthGrpcController {
  constructor(private readonly userAuthService: UserAuthService) {}

  @GrpcMethod('UserAuthService', 'Register')
  @RequirePermission(
    Permission.AUTH_SERVICE_USERS_WRITE,
    Permission.AUTH_SERVICE_SESSIONS_WRITE,
  )
  async register(data: RegisterDto): Promise<RegisterResponse> {
    return this.userAuthService.register(data);
  }

  @GrpcMethod('UserAuthService', 'Login')
  @RequirePermission(
    Permission.AUTH_SERVICE_USERS_READ,
    Permission.AUTH_SERVICE_SESSIONS_WRITE,
  )
  async login(data: LoginDto): Promise<LoginResponse> {
    return this.userAuthService.login(data);
  }

  @GrpcMethod('UserAuthService', 'Logout')
  @RequirePermission(Permission.AUTH_SERVICE_SESSIONS_INVALIDATE)
  async logout(data: LogoutDto): Promise<LogoutResponse> {
    return this.userAuthService.logout(data);
  }

  @GrpcMethod('UserAuthService', 'GetActiveSessions')
  @RequirePermission(Permission.AUTH_SERVICE_SESSIONS_READ)
  async getActiveSessions(
    data: GetActiveSessionsDto,
  ): Promise<GetActiveSessionsResponse> {
    return this.userAuthService.getActiveSessions(data);
  }

  @GrpcMethod('UserAuthService', 'TerminateSession')
  @RequirePermission(Permission.AUTH_SERVICE_SESSIONS_INVALIDATE)
  async terminateSession(
    data: TerminateSessionDto,
  ): Promise<TerminateSessionResponse> {
    return this.userAuthService.terminateSession(data);
  }

  @GrpcMethod('UserAuthService', 'TerminateAllOtherSessions')
  @RequirePermission(Permission.AUTH_SERVICE_SESSIONS_INVALIDATE)
  async terminateAllOtherSessions(
    data: TerminateAllOtherSessionsDto,
  ): Promise<TerminateAllOtherSessionsResponse> {
    return this.userAuthService.terminateAllOtherSessions(data);
  }

  @GrpcMethod('UserAuthService', 'GetUserPublicKey')
  @RequirePermission(Permission.AUTH_SERVICE_USERS_READ)
  async getUserPublicKey(
    data: GetUserPublicKeyDto,
  ): Promise<GetUserPublicKeyResponse> {
    return this.userAuthService.getUserPublicKey(data);
  }

  @GrpcMethod('UserAuthService', 'ChangePassword')
  @RequirePermission(Permission.AUTH_SERVICE_USERS_WRITE)
  async changePassword(
    data: ChangePasswordDto,
  ): Promise<ChangePasswordResponse> {
    return this.userAuthService.changePassword(data);
  }

  @GrpcMethod('UserAuthService', 'ValidateSession')
  @RequirePermission(Permission.AUTH_SERVICE_SESSIONS_READ)
  async validateSession(data: {
    sessionToken: string;
  }): Promise<ValidateSessionResponse> {
    return this.userAuthService.validateSession(data.sessionToken);
  }
}
