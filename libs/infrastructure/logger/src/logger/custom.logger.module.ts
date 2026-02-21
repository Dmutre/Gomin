import { Module } from '@nestjs/common';
import { LoggerModule, nativeLoggerOptions } from 'nestjs-pino';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: nativeLoggerOptions,
    }),
  ],
})
export class CustomLoggerModule {}
