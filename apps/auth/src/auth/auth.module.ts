import { Module } from '@nestjs/common';
import { AuthGrpcController } from './auth.grpc.controller';
import { AuthService } from './auth.service';
import { UserModule } from '../users/user.module';
import { UserSessionModule } from '../user-sessions/user-session.module';

@Module({
  imports: [UserModule, UserSessionModule],
  controllers: [AuthGrpcController],
  providers: [AuthService],
})
export class AuthModule {}
