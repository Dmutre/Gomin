import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CustomLoggerModule } from '@gomin/logger';
import { MicroserviceIdentityModule } from '@gomin/service-identity';
import configs from '../config/config';
import { validationSchema } from '../config/schemas';
import { RedisModule } from '../redis/redis.module';
import { AuthGrpcModule } from '../grpc/auth-grpc.module';
import { CommunicationGrpcModule } from '../grpc/communication-grpc.module';
import { AuthModule } from '../auth/auth.module';
import { ChatsModule } from '../chats/chats.module';
import { MessagesModule } from '../messages/messages.module';
import { SenderKeysModule } from '../sender-keys/sender-keys.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      load: configs,
    }),
    CustomLoggerModule,
    RedisModule,

    MicroserviceIdentityModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        authServiceUrl: config.get<string>('serviceIdentity.authServiceUrl')!,
        serviceName: config.get<string>('serviceIdentity.serviceName')!,
        serviceSecret: config.get<string>('serviceIdentity.serviceSecret')!,
      }),
    }),

    AuthGrpcModule,
    CommunicationGrpcModule,

    AuthModule,
    ChatsModule,
    MessagesModule,
    SenderKeysModule,
    WebSocketModule,
  ],
})
export class AppModule {}
