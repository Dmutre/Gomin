import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthClientModule } from '@gomin/grpc';

@Global()
@Module({
  imports: [
    AuthClientModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        url: config.get<string>('authService.url')!,
      }),
    }),
  ],
  exports: [AuthClientModule],
})
export class AuthGrpcModule {}
