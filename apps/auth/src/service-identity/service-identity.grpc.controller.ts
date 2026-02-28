import { Controller, UseGuards } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import type {
  AuthenticateServiceIdentityResponse,
  GetPublicKeysResponse,
} from '@gomin/grpc';
import { ServiceIdentityService } from './service-identity.service';
import { LocalIdentityGuard } from '../local-identity/local-identity.guard';
import { Permission, RequirePermission } from '@gomin/service-identity';

@Controller()
export class ServiceIdentityGrpcController {
  constructor(
    private readonly serviceIdentityService: ServiceIdentityService,
  ) {}

  @GrpcMethod('ServiceIdentityService', 'AuthenticateServiceIdentity')
  async authenticateServiceIdentity(data: {
    serviceName: string;
    serviceSecret: string;
  }): Promise<AuthenticateServiceIdentityResponse> {
    return this.serviceIdentityService.authenticateServiceIdentity(
      data.serviceName,
      data.serviceSecret,
    );
  }

  @UseGuards(LocalIdentityGuard)
  @GrpcMethod('ServiceIdentityService', 'GetPublicKeys')
  @RequirePermission(Permission.SERVICE_IDENTITY_GET_PUBLIC_KEYS)
  getPublicKeys(): GetPublicKeysResponse {
    return this.serviceIdentityService.getPublicKeys();
  }
}
