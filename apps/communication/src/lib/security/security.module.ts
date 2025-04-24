import { Module } from "@nestjs/common";
import { ChatPermissionsGuard } from "./guards/chat-permission.guard";
import { PermissionClientModule } from "@gomin/utils";
import { ChatOwnershipGuard } from "./guards/chat-ownership.guard";
import { DatabaseModule } from "../database/database.module";

@Module({
  providers: [ChatPermissionsGuard, ChatOwnershipGuard],
  imports: [PermissionClientModule, DatabaseModule],
  exports: [ChatPermissionsGuard, ChatOwnershipGuard],
})
export class CommunicationSecurityModule {}
