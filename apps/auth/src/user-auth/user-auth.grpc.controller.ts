import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
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
export class UserAuthGrpcController {
  constructor(private readonly userAuthService: UserAuthService) {}

  @GrpcMethod('UserAuthService', 'Register')
  async register(data: RegisterDto): Promise<RegisterResponse> {
    return this.userAuthService.register(data);
  }

  @GrpcMethod('UserAuthService', 'Login')
  async login(data: LoginDto): Promise<LoginResponse> {
    return this.userAuthService.login(data);
  }

  @GrpcMethod('UserAuthService', 'Logout')
  async logout(data: LogoutDto): Promise<LogoutResponse> {
    return this.userAuthService.logout(data);
  }

  @GrpcMethod('UserAuthService', 'GetActiveSessions')
  async getActiveSessions(
    data: GetActiveSessionsDto,
  ): Promise<GetActiveSessionsResponse> {
    return this.userAuthService.getActiveSessions(data);
  }

  @GrpcMethod('UserAuthService', 'TerminateSession')
  async terminateSession(
    data: TerminateSessionDto,
  ): Promise<TerminateSessionResponse> {
    return this.userAuthService.terminateSession(data);
  }

  @GrpcMethod('UserAuthService', 'TerminateAllOtherSessions')
  async terminateAllOtherSessions(
    data: TerminateAllOtherSessionsDto,
  ): Promise<TerminateAllOtherSessionsResponse> {
    return this.userAuthService.terminateAllOtherSessions(data);
  }
}
