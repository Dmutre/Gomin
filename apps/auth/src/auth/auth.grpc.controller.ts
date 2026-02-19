import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AuthService } from './auth.service';
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
export class AuthGrpcController {
  constructor(private readonly authService: AuthService) {}

  @GrpcMethod('AuthService', 'Register')
  async register(
    data: RegisterDto,
  ): Promise<RegisterResponse> {
    return this.authService.register(data);
  }

  @GrpcMethod('AuthService', 'Login')
  async login(
    data: LoginDto,
  ): Promise<LoginResponse> {
    return this.authService.login(data);
  }

  @GrpcMethod('AuthService', 'Logout')
  async logout(data: LogoutDto): Promise<LogoutResponse> {
    return this.authService.logout(data);
  }

  @GrpcMethod('AuthService', 'GetActiveSessions')
  async getActiveSessions(data: GetActiveSessionsDto): Promise<GetActiveSessionsResponse> {
    return this.authService.getActiveSessions(data);
  }

  @GrpcMethod('AuthService', 'TerminateSession')
  async terminateSession(data: TerminateSessionDto): Promise<TerminateSessionResponse> {
    return this.authService.terminateSession(data);
  }

  @GrpcMethod('AuthService', 'TerminateAllOtherSessions')
  async terminateAllOtherSessions(
    data: TerminateAllOtherSessionsDto,
  ): Promise<TerminateAllOtherSessionsResponse> {
    return this.authService.terminateAllOtherSessions(data);
  }
}
