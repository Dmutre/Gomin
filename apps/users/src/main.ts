import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ServerConfig } from '@gomin/common';
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
      //exceptionFactory: validationExceptionFactory,
    }),
  );
  //microservice.useGlobalFilters(new AllExceptionsFilter());
  microservice.useLogger(logger);

  await microservice
    .listen()
    .then(() => logger.log(`Users service started on PORT: ${serverConfig.port}, HOST:${serverConfig.host}`));
}

bootstrap();
