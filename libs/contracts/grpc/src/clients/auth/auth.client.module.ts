import { Module } from '@nestjs/common';
import { AuthGrpcClient } from './auth.grpc.client';

@Module({
  providers: [AuthGrpcClient],
  exports: [AuthGrpcClient],
})
export class AuthClientModule {}
