import { Module } from "@nestjs/common";
import { NotificationModule } from "./notification/notification.module";
import { ConfigSmith, LoggerModule } from "@gomin/common";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [ConfigSmith],
    }),
    LoggerModule,
    NotificationModule,
  ],
})
export class AppModule {}


