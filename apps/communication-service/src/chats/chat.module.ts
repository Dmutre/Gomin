import { Module } from '@nestjs/common';
import { ChatRepository } from './chat.repository';
import { ChatMemberRepository } from './chat-member.repository';
import { ChatService } from './chat.service';
import { ChatGrpcController } from './chat.grpc.controller';

@Module({
  controllers: [ChatGrpcController],
  providers: [ChatRepository, ChatMemberRepository, ChatService],
  exports: [ChatService, ChatMemberRepository, ChatRepository],
})
export class ChatModule {}
