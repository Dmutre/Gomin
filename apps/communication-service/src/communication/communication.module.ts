import { Module } from '@nestjs/common';
import { CommunicationGrpcController } from './communication.grpc.controller';
import { ChatModule } from '../chats/chat.module';
import { MessageModule } from '../messages/message.module';

@Module({
  imports: [ChatModule, MessageModule],
  controllers: [CommunicationGrpcController],
})
export class CommunicationModule {}
