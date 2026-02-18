import { Module } from '@nestjs/common';
import { UserSessionRepository } from './user-session.repository';
import { UserSessionService } from './user-session.service';

@Module({
  providers: [UserSessionService, UserSessionRepository],
  exports: [UserSessionService],
})
export class UserSessionModule {}
