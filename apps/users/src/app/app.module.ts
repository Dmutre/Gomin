import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { ConfigSmith, LoggerModule } from '@gomin/common';
import { AuthModule } from '../api/auth/auth.module';
import { NotificationClientModule } from '@gomin/utils';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [ConfigSmith],
    }),
    LoggerModule,
    AuthModule,
    NotificationClientModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
