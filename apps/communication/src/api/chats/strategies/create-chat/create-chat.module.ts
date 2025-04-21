import { Module } from "@nestjs/common";
import { CreateChannelStrategy } from "./create-channel-chat.strategy";
import { CreatePrivateChatStrategy } from "./create-private-chat.strategy";
import { CreateGroupStrategy } from "./create-group-chat.strategy";
import { PermissionClientModule } from "@gomin/utils";
import { DatabaseModule } from "../../../../lib/database/database.module";
import { CreateChatService } from "./create-chat.service";

@Module({
  providers: [
    CreateChannelStrategy,
    CreatePrivateChatStrategy,
    CreateGroupStrategy,
    CreateChatService,
  ],
  imports: [PermissionClientModule, DatabaseModule],
  exports: [CreateChatService],
})
export class CreateChatModule {}