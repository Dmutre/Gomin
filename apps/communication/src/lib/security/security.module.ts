import { Module } from "@nestjs/common";
import { ChatPermissionsGuard } from "./guards/chat-permission.guard";
import { PermissionClientModule } from "@gomin/utils";
import { ChatOwnershipGuard } from "./guards/chat-ownership.guard";
import { DatabaseModule } from "../database/database.module";
import { ExecutorBelongsToChatGuard } from "./guards/executor-belongs-to-chat.guard";
import { ExecutorOwnMessageGuard } from "./guards/executor-own-message.guard";

@Module({
  imports: [PermissionClientModule, DatabaseModule],
  providers: [ChatPermissionsGuard, ChatOwnershipGuard, ExecutorBelongsToChatGuard, ExecutorOwnMessageGuard],
  exports: [ChatPermissionsGuard, ChatOwnershipGuard, ExecutorBelongsToChatGuard, ExecutorOwnMessageGuard],
})
export class CommunicationSecurityModule {}
