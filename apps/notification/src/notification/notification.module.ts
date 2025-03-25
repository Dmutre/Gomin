import { Module } from "@nestjs/common";
import { PushModule } from "../libs/channels/push/push.module";
import { EmailModule } from "../libs/channels/mail/email.module";
import { NotificationController } from "./notification.controller";
import { NotificationService } from "./notification.service";

@Module({
  imports: [EmailModule, PushModule],
  controllers: [NotificationController],
  providers: [NotificationService],
})
export class NotificationModule {}

