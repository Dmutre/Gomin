import { Module } from '@nestjs/common';
import { LocalIdentityModule } from '../local-identity/local-identity.module';
import { UserAuthGrpcController } from './user-auth.grpc.controller';
import { UserAuthService } from './user-auth.service';
import { UserModule } from '../users/user.module';
import { UserSessionModule } from '../user-sessions/user-session.module';

@Module({
  imports: [LocalIdentityModule, UserModule, UserSessionModule],
  controllers: [UserAuthGrpcController],
  providers: [UserAuthService],
})
export class UserAuthModule {}
