import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { SERVICE_IDENTITY_CLIENT } from './service-identity.client.module';
import type {
  AuthenticateServiceIdentityRequest,
  AuthenticateServiceIdentityResponse,
  GetPublicKeysRequest,
  GetPublicKeysResponse,
} from '../../types/generated/service-identity';

export interface IServiceIdentityService {
  authenticateServiceIdentity(
    data: AuthenticateServiceIdentityRequest,
  ): Observable<AuthenticateServiceIdentityResponse>;
  getPublicKeys(data: GetPublicKeysRequest): Observable<GetPublicKeysResponse>;
}

@Injectable()
export class ServiceIdentityGrpcClient implements OnModuleInit {
  private service!: IServiceIdentityService;

  constructor(
    @Inject(SERVICE_IDENTITY_CLIENT) private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.service = this.client.getService<IServiceIdentityService>(
      'ServiceIdentityService',
    );
  }

  authenticateServiceIdentity(
    data: AuthenticateServiceIdentityRequest,
  ): Observable<AuthenticateServiceIdentityResponse> {
    return this.service.authenticateServiceIdentity(data);
  }

  getPublicKeys(): Observable<GetPublicKeysResponse> {
    return this.service.getPublicKeys({});
  }
}
