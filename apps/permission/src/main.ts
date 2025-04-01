import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { MicroserviceExceptionFilter, ServerConfig, MicroserviceValidationExceptionFactory } from '@gomin/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';

async function bootstrap() {

  const app = await NestFactory.create(AppModule);

  const serverConfig: ServerConfig = app.get<ConfigService>(ConfigService).get<ServerConfig>('server');
  const logger = app.get<Logger>(Logger);

  const microserviceOptions: MicroserviceOptions = {
    transport: Transport.TCP,
    options: {
      host: serverConfig.host,
      port: serverConfig.port,
    },
  };

  const microservice =
    await NestFactory.createMicroservice<MicroserviceOptions>(
      AppModule,
      microserviceOptions,
    );

  microservice.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      exceptionFactory: MicroserviceValidationExceptionFactory,
    }),
  );
  microservice.useLogger(logger);
  microservice.useGlobalFilters(new MicroserviceExceptionFilter(logger))

  await microservice
    .listen()
    .then(() => logger.log(`Permission service started on PORT: ${serverConfig.port}, HOST:${serverConfig.host}`));
}

bootstrap();
