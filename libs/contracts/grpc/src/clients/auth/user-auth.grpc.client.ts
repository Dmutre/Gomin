import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Metadata } from '@grpc/grpc-js';
import { Observable } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { USER_AUTH_CLIENT } from './user-auth.tokens';
import type {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  LogoutResponse,
  GetActiveSessionsRequest,
  GetActiveSessionsResponse,
  TerminateSessionRequest,
  TerminateSessionResponse,
  TerminateAllOtherSessionsRequest,
  TerminateAllOtherSessionsResponse,
  GetUserPublicKeyRequest,
  GetUserPublicKeyResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  ValidateSessionRequest,
  ValidateSessionResponse,
} from '../../types/generated/user-auth';

export interface IUserAuthService {
  register(
    data: RegisterRequest,
    metadata?: Metadata,
  ): Observable<RegisterResponse>;
  login(data: LoginRequest, metadata?: Metadata): Observable<LoginResponse>;
  logout(data: LogoutRequest, metadata?: Metadata): Observable<LogoutResponse>;
  getActiveSessions(
    data: GetActiveSessionsRequest,
    metadata?: Metadata,
  ): Observable<GetActiveSessionsResponse>;
  terminateSession(
    data: TerminateSessionRequest,
    metadata?: Metadata,
  ): Observable<TerminateSessionResponse>;
  terminateAllOtherSessions(
    data: TerminateAllOtherSessionsRequest,
    metadata?: Metadata,
  ): Observable<TerminateAllOtherSessionsResponse>;
  getUserPublicKey(
    data: GetUserPublicKeyRequest,
    metadata?: Metadata,
  ): Observable<GetUserPublicKeyResponse>;
  changePassword(
    data: ChangePasswordRequest,
    metadata?: Metadata,
  ): Observable<ChangePasswordResponse>;
  validateSession(
    data: ValidateSessionRequest,
    metadata?: Metadata,
  ): Observable<ValidateSessionResponse>;
}

@Injectable()
export class UserAuthGrpcClient implements OnModuleInit {
  private service!: IUserAuthService;

  constructor(@Inject(USER_AUTH_CLIENT) private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.service = this.client.getService<IUserAuthService>('UserAuthService');
  }

  register(
    data: RegisterRequest,
    metadata?: Metadata,
  ): Promise<RegisterResponse> {
    return firstValueFrom(this.service.register(data, metadata));
  }

  login(data: LoginRequest, metadata?: Metadata): Promise<LoginResponse> {
    return firstValueFrom(this.service.login(data, metadata));
  }

  logout(data: LogoutRequest, metadata?: Metadata): Promise<LogoutResponse> {
    return firstValueFrom(this.service.logout(data, metadata));
  }

  getActiveSessions(
    data: GetActiveSessionsRequest,
    metadata?: Metadata,
  ): Promise<GetActiveSessionsResponse> {
    return firstValueFrom(this.service.getActiveSessions(data, metadata));
  }

  terminateSession(
    data: TerminateSessionRequest,
    metadata?: Metadata,
  ): Promise<TerminateSessionResponse> {
    return firstValueFrom(this.service.terminateSession(data, metadata));
  }

  terminateAllOtherSessions(
    data: TerminateAllOtherSessionsRequest,
    metadata?: Metadata,
  ): Promise<TerminateAllOtherSessionsResponse> {
    return firstValueFrom(
      this.service.terminateAllOtherSessions(data, metadata),
    );
  }

  getUserPublicKey(
    data: GetUserPublicKeyRequest,
    metadata?: Metadata,
  ): Promise<GetUserPublicKeyResponse> {
    return firstValueFrom(this.service.getUserPublicKey(data, metadata));
  }

  changePassword(
    data: ChangePasswordRequest,
    metadata?: Metadata,
  ): Promise<ChangePasswordResponse> {
    return firstValueFrom(this.service.changePassword(data, metadata));
  }

  validateSession(
    data: ValidateSessionRequest,
    metadata?: Metadata,
  ): Promise<ValidateSessionResponse> {
    return firstValueFrom(this.service.validateSession(data, metadata));
  }
}
