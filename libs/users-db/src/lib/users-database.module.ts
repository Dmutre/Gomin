import { Module } from '@nestjs/common';
import { UsersPrismaService } from './users-database.service';

@Module({
  providers: [UsersPrismaService],
  exports: [UsersPrismaService],
})
export class UserDatabaseModule {}
