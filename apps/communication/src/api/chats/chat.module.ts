import { Module } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { DatabaseModule } from "../../lib/database/database.module";
import { ChatController } from "./chat.controller";
import { CreateChatModule } from "./strategies/create-chat/create-chat.module";

@Module({
  providers: [ChatService],
  imports: [DatabaseModule, CreateChatModule],
  controllers: [ChatController],
})
export class ChatModule {}