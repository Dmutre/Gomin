import { MicroservicesConfig, COMMUNICATION_SERVICE } from "@gomin/common";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ClientOptions, ClientProxyFactory } from "@nestjs/microservices";
import { ChatClient } from "./chat.client";
import { MessageClient } from "./message.client";

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: COMMUNICATION_SERVICE,
      useFactory: (configService: ConfigService) => {
        const communicationServiceOptions =
          configService.get<MicroservicesConfig>('microservices')?.communicationService as ClientOptions;
        return ClientProxyFactory.create(communicationServiceOptions);
      },
      inject: [ConfigService],
    },
    ChatClient,
    MessageClient,
  ],
  exports: [
    ChatClient,
    MessageClient,
  ],
})
export class CommunicationClientModule {}

