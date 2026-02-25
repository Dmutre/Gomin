import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import type {
  AuthenticateServiceIdentityResponse,
  GetPublicKeysResponse,
} from '@gomin/grpc';
import { ServiceIdentityService } from './service-identity.service';

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

  @GrpcMethod('ServiceIdentityService', 'GetPublicKeys')
  getPublicKeys(): GetPublicKeysResponse {
    return this.serviceIdentityService.getPublicKeys();
  }
}
