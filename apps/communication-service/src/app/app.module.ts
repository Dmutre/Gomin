import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { validationSchema } from '../config/schemas';
import configs from '../config/config';
import { CustomLoggerModule } from '@gomin/logger';
import { KnexDatabaseModule } from '@gomin/database';
import { RedisModule } from '@gomin/redis';
import { MetricsModule } from '@gomin/metrics';
import { MicroserviceIdentityModule } from '@gomin/service-identity';
import { CommunicationModule } from '../communication/communication.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      load: configs,
    }),
    CustomLoggerModule,
    MetricsModule,
    KnexDatabaseModule,
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: () => ({ prefix: 'communication' }),
    }),
    MicroserviceIdentityModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        authServiceUrl: config.get<string>('serviceIdentity.authServiceUrl')!,
        serviceName: config.get<string>('serviceIdentity.serviceName')!,
        serviceSecret: config.get<string>('serviceIdentity.serviceSecret')!,
      }),
    }),
    CommunicationModule,
  ],
})
export class AppModule {}
