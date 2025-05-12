import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { APP_GUARD } from "@nestjs/core";
import { AuthGuard } from "../../libs/security/auth.guard";
import { ChatController } from "./chat.controller";
import { CommunicationClientModule } from "@gomin/utils";
import { ChatService } from "./chat.service";

@Module({
  imports: [AuthModule, CommunicationClientModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    ChatService,
  ],
  controllers: [ChatController],
})
export class ChatModule {}