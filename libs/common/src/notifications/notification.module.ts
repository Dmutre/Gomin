import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MicroservicesConfig, NOTIFICATIONS_SERVICE } from "../config";
import { ClientOptions, ClientProxyFactory } from "@nestjs/microservices";
import { NotificationClient } from "./notification.client";

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: NOTIFICATIONS_SERVICE,
      useFactory: (configService: ConfigService) => {
        const notificationServiceOptions =
          configService.get<MicroservicesConfig>('microservices')?.notificationsService as ClientOptions;
        return ClientProxyFactory.create(notificationServiceOptions);
      },
      inject: [ConfigService],
    },
    NotificationClient,
  ],
  exports: [NotificationClient],
})
export class NotificationClientModule {}