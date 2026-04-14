import { Module } from '@nestjs/common';
import { MessageRepository } from './message.repository';
import { SenderKeyRepository } from './sender-key.repository';
import { MessageStatusRepository } from './message-status.repository';
import { MessageReactionRepository } from './message-reaction.repository';
import { MessageService } from './message.service';
import { MessageGrpcController } from './message.grpc.controller';
import { ChatModule } from '../chats/chat.module';

@Module({
  imports: [ChatModule],
  controllers: [MessageGrpcController],
  providers: [
    MessageRepository,
    SenderKeyRepository,
    MessageStatusRepository,
    MessageReactionRepository,
    MessageService,
  ],
  exports: [MessageService],
})
export class MessageModule {}
