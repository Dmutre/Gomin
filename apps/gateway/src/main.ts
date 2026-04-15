import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app/app.module';
import { CONFIG_NAMESPACES } from './config/consts';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get<Logger>(Logger);
  app.useLogger(logger);

  const config = app.get(ConfigService);
  const port = config.getOrThrow<number>(`${CONFIG_NAMESPACES.APP}.port`);
  const host = config.getOrThrow<string>(`${CONFIG_NAMESPACES.APP}.host`);
  const nodeEnv = config.getOrThrow<string>(`${CONFIG_NAMESPACES.APP}.nodeEnv`);

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Gomin API Gateway')
      .setDescription('HTTP gateway for development')
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(port, host);
  logger.log(`Gateway is running on http://${host}:${port}/${globalPrefix}`);
  if (nodeEnv !== 'production') {
    logger.log(`Swagger UI: http://${host}:${port}/api/docs`);
  }
}

bootstrap();
