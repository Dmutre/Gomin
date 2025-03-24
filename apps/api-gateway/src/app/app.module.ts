import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { ConfigSmith } from '@gomin/common'
import { LoggerModule } from '@gomin/common'
import { AuthModule } from '../api/auth/auth.module';
import { ClsModule } from 'nestjs-cls';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [ConfigSmith]
    }),
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
    }),
    LoggerModule,
    AuthModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
