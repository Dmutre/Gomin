import { Module } from '@nestjs/common';
import { ServiceIdentityGrpcController } from './service-identity.grpc.controller';
import { ServiceIdentityRepository } from './service-identity.repository';
import { ServiceIdentityService } from './service-identity.service';
import { LocalIdentityModule } from '../local-identity/local-identity.module';

@Module({
  imports: [LocalIdentityModule],
  controllers: [ServiceIdentityGrpcController],
  providers: [ServiceIdentityService, ServiceIdentityRepository],
})
export class ServiceIdentityModule {}
