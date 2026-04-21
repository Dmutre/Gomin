import './tracing';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { GrpcExceptionFilter } from './common/filters/grpc-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const config = app.get(ConfigService);
  const logger = app.get(Logger);
  app.useLogger(logger);

  const redisHost = config.get<string>('redis.host') ?? 'localhost';
  const redisPort = config.get<number>('redis.port') ?? 6379;
  const redisPassword = config.get<string>('redis.password') || undefined;

  const pubClient = new Redis({
    host: redisHost,
    port: redisPort,
    password: redisPassword,
  });
  const subClient = pubClient.duplicate();

  class RedisIoAdapter extends IoAdapter {
    createIOServer(port: number, options?: Record<string, unknown>) {
      const server = super.createIOServer(port, options);
      server.adapter(createAdapter(pubClient, subClient));
      return server;
    }
  }

  app.useWebSocketAdapter(new RedisIoAdapter(app));

  app.useGlobalFilters(new GrpcExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Gomin API Gateway')
    .setDescription(
      'Entry point for all client interactions.\n\n' +
        '**Auth**: All endpoints (except /auth/register and /auth/login) require ' +
        '`Authorization: Bearer <sessionToken>` header.\n\n' +
        '**WebSocket**: Connect to `ws://<host>:<port>` with `?token=<sessionToken>` ' +
        'or pass `{ auth: { token } }` in the socket.io handshake.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const port = config.get<number>('app.port') ?? 3000;
  app.setGlobalPrefix('api');

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);
  await app.listen(port);

  logger.log(`Gateway running on http://localhost:${port}/api`);
  logger.log(`Swagger docs at http://localhost:${port}/docs`);
}

bootstrap();
