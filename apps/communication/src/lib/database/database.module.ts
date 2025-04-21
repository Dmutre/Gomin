import { Module } from "@nestjs/common";
import { CommunicationDatabaseModule } from "@gomin/communication-db";
import { ChatRepository } from "./repositories/chat.repository";
import { MessageRepository } from "./repositories/message.repository";
import { UserChatRepository } from "./repositories/user-chat.repository";

@Module({
  imports: [CommunicationDatabaseModule],
  providers: [ChatRepository, MessageRepository, UserChatRepository],
  exports: [ChatRepository, MessageRepository, UserChatRepository],
})
export class DatabaseModule {}