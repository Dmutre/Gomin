import { Module } from '@nestjs/common';
import { MessagingGateway } from './messaging.gateway';
import { WsSessionGuard } from './ws-session.guard';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [MessagingGateway, WsSessionGuard],
  exports: [MessagingGateway],
})
export class WebSocketModule {}
