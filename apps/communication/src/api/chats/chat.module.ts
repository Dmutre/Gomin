import { Module } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { DatabaseModule } from "../../lib/database/database.module";
import { ChatController } from "./chat.controller";
import { CreateChatModule } from "./strategies/create-chat/create-chat.module";
import { CommunicationSecurityModule } from "../../lib/security/security.module";
import { PermissionClientModule } from "@gomin/utils";

@Module({
  providers: [ChatService],
  imports: [DatabaseModule, CreateChatModule, CommunicationSecurityModule, PermissionClientModule],
  controllers: [ChatController],
})
export class ChatModule {}