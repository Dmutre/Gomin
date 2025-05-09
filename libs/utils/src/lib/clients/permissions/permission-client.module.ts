import { MicroservicesConfig, PERMISSIONS_SERVICE } from "@gomin/common";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ClientOptions, ClientProxyFactory } from "@nestjs/microservices";
import { PermissionClient } from "./permission.client";

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: PERMISSIONS_SERVICE,
      useFactory: (configService: ConfigService) => {
        const permissionsServiceOptions =
          configService.get<MicroservicesConfig>('microservices')?.permissionsService as ClientOptions;
        return ClientProxyFactory.create(permissionsServiceOptions);
      },
      inject: [ConfigService],
    },
    PermissionClient,
  ],
  exports: [PermissionClient],
})
export class PermissionClientModule {}

