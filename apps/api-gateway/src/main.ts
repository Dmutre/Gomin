import { Logger } from 'nestjs-pino';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ServerConfig } from '@gomin/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {

  const app = await NestFactory.create(AppModule);

  const logger = app.get(Logger);
  const serverConfig: ServerConfig = app.get<ConfigService>(ConfigService).get<ServerConfig>('server');

  app.useLogger(logger);

  const port = serverConfig.port;
  const host = serverConfig.host;
  await app.listen(port, host, () => {
    logger.log(`Apigateway started on PORT: ${port}, HOST: ${host}`)
  });
}

bootstrap();
