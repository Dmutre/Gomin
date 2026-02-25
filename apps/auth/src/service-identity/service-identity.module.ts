import { Module } from '@nestjs/common';
import { ServiceIdentityGrpcController } from './service-identity.grpc.controller';
import { ServiceIdentityRepository } from './service-identity.repository';
import { ServiceIdentityService } from './service-identity.service';

@Module({
  controllers: [ServiceIdentityGrpcController],
  providers: [ServiceIdentityService, ServiceIdentityRepository],
})
export class ServiceIdentityModule {}
