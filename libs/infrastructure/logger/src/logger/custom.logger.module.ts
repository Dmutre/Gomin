import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import type { Options } from 'pino-http';

const isDevelopment = process.env['NODE_ENV'] !== 'production';

const pinoHttpOptions = {
  messageKey: 'message',
  level: process.env['LOG_LEVEL'] ?? 'info',
  base: {
    pid: process.pid,
    service: process.env['SERVICE_NAME'] ?? 'unknown',
  },
  formatters: {
    level: (label: string) => ({ level: label }),
  },
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
  ...(isDevelopment && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        singleLine: false,
        translateTime: 'SYS:standard',
        ignore: 'hostname',
      },
    },
  }),
};

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: pinoHttpOptions as Options,
    }),
  ],
})
export class CustomLoggerModule {}
