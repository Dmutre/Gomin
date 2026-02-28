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
} from '@gomin/grpc';
import {
  RegisterDto,
  LoginDto,
  LogoutDto,
  GetActiveSessionsDto,
  TerminateSessionDto,
  TerminateAllOtherSessionsDto,
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
}
