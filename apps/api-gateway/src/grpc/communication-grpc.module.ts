import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CommunicationClientModule } from '@gomin/grpc';

@Global()
@Module({
  imports: [
    CommunicationClientModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        url: config.get<string>('communicationService.url')!,
      }),
    }),
  ],
  exports: [CommunicationClientModule],
})
export class CommunicationGrpcModule {}
