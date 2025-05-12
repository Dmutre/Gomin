import { MicroservicesConfig, USERS_SERVICE } from "@gomin/common";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ClientProxyFactory } from '@nestjs/microservices';
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: USERS_SERVICE,
      useFactory: (configService: ConfigService) => {
        const userServiceOptions =
          configService.get<MicroservicesConfig>('microservices').usersService;
        return ClientProxyFactory.create(userServiceOptions);
      },
      inject: [ConfigService],
    },
    AuthService,
  ],
  exports: [USERS_SERVICE, AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
