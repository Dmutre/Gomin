import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from 'nestjs-pino';
import { join } from 'path';
import { GrpcExceptionFilter } from '@gomin/app';

async function bootstrap() {
  const microserviceUrl = `${process.env.HOST || 'localhost'}:${process.env.GRPC_PORT || '5000'}`;
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      bufferLogs: true,
      transport: Transport.GRPC,
      options: {
        package: ['user_auth', 'service_identity'],
        url: microserviceUrl,
        protoPath: [
          join(__dirname, 'protos', 'user-auth.proto'),
          join(__dirname, 'protos', 'service-identity.proto'),
        ],
      },
    },
  );

  const logger = app.get<Logger>(Logger);

  app.useLogger(logger);
  app.useGlobalFilters(new GrpcExceptionFilter())

  await app.listen().then(() => {
    logger.log(
      'Auth microservice started successfully. URL: ' + microserviceUrl,
    );
  });
}

bootstrap();
