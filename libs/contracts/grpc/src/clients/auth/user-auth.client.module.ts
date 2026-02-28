import { Module } from '@nestjs/common';
import { UserAuthGrpcClient } from './user-auth.grpc.client';

@Module({
  providers: [UserAuthGrpcClient],
  exports: [UserAuthGrpcClient],
})
export class AuthClientModule {}
