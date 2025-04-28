import { Module } from "@nestjs/common";
import { CommunicationSecurityModule } from "../../lib/security/security.module";
import { DatabaseModule } from "../../lib/database/database.module";
import { MessageService } from "./message.service";
import { MessageController } from "./message.controller";
import { PermissionClientModule } from "@gomin/utils";

@Module({
  imports: [CommunicationSecurityModule, DatabaseModule, PermissionClientModule],
  providers: [MessageService],
  controllers: [MessageController],
})
export class MessageModule {}