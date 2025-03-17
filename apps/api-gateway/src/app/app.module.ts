import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { ConfigSmith } from '@gomin/common'
import { LoggerModule } from '@gomin/common'
import { AuthModule } from '../api/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [ConfigSmith]
    }),
    LoggerModule,
    AuthModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
