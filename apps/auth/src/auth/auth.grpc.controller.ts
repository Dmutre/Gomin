import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import type { LoginRequest, LoginResponse } from '@gomin/grpc';

@Controller()
export class AuthGrpcController {
  constructor(private readonly authService: AuthService) {}

  @GrpcMethod('AuthService', 'Login')
  async login(data: LoginRequest, metadata?: { ip?: string; userAgent?: string }): Promise<LoginResponse> {
    const context = metadata ? { ip: metadata.ip, userAgent: metadata.userAgent } : undefined;
    return this.authService.login(data, context);
  }
}
