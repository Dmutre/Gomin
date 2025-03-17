import { Logger } from 'nestjs-pino';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ServerConfig } from '@gomin/common';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const logger = app.get<Logger>(Logger);
  const serverConfig: ServerConfig = app.get<ConfigService>(ConfigService).get<ServerConfig>('server');

  app.useLogger(logger);
  app.use(cookieParser());
  app.useBodyParser('json', { limit: '50mb' });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      }
    })
  );
  app.enableCors({
    origin: serverConfig.cors.origin,
    methods: serverConfig.cors.methods,
    credentials: true,
  });

  const options = new DocumentBuilder()
  .setTitle('Gomin API docs')
  .setDescription('Gomin API documentation')
  .setVersion('0.1')
  .addSecurity('bearer', {
    type: 'http',
    scheme: 'bearer',
  })
  .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);

  const port = serverConfig.port;
  const host = serverConfig.host;

  await app.listen(port, host, () => {
    logger.log(`Apigateway started on PORT: ${port}, HOST: ${host}`)
  });
}

bootstrap();
