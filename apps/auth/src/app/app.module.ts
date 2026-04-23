import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { validationSchema } from '../config/schemas';
import configs from '../config/config';
import { CustomLoggerModule } from '@gomin/logger';
import { KnexDatabaseModule } from '@gomin/database';
import { RedisModule } from '@gomin/redis';
import { MetricsModule } from '@gomin/metrics';
import { UserModule } from '../users/user.module';
import { UserSessionModule } from '../user-sessions/user-session.module';
import { UserAuthModule } from '../user-auth/user-auth.module';
import { ServiceIdentityModule } from '../service-identity/service-identity.module';

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
      useFactory: () => ({ prefix: 'auth' }),
    }),
    UserModule,
    UserSessionModule,
    UserAuthModule,
    ServiceIdentityModule,
  ],
})
export class AppModule {}
