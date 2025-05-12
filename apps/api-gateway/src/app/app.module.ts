import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { ConfigSmith } from '@gomin/common'
import { LoggerModule } from '@gomin/common'
import { AuthModule } from '../api/auth/auth.module';
import { ClsModule } from 'nestjs-cls';
import { ChatModule } from '../api/chat/chat.module';
import { GatewayModule } from '../api/gateway/gateway.module';

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
    ChatModule,
    GatewayModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
