import { Module } from '@nestjs/common';
import { PermissionModule } from './permission/permission.module';
import { ConfigSmith, LoggerModule } from '@gomin/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [ConfigSmith],
    }),
    LoggerModule,
    PermissionModule,
  ],
})
export class AppModule {}
